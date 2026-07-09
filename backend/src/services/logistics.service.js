import axios from "axios";

// Centralized Axios client for Delhivery Production
const delhiveryAPI = axios.create({
  baseURL: process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com",
  headers: {
    Accept: "application/json",
    Authorization: `Token ${process.env.DELHIVERY_API_KEY}`,
  },
});

/**
 * Check Pincode Serviceability
 * Validates an address before checkout or fulfillment.
 */
export const checkPincodeServiceability = async (pinCode) => {
  try {
    const response = await delhiveryAPI.get(`/c/api/pin-codes/json/?filter_codes=${pinCode}`);
    
    const deliveryCodes = response.data.delivery_codes || [];
    if (deliveryCodes.length === 0) return { isServiceable: false };

    const pinData = deliveryCodes[0].postal_code;
    return {
      isServiceable: true,
      hasCOD: pinData.cod === "Y",
      hasPrepaid: pinData.pre_paid === "Y",
      city: pinData.city,
      state: pinData.state_code,
    };
  } catch (error) {
    console.error("[Delhivery] Pincode Check Failed:", error.message);
    throw new Error("Failed to verify pincode with logistics partner.");
  }
};

/**
 * Create Shipment (Fulfill Order)
 * The main engine for pushing an order to Delhivery.
 */
export const createShipment = async (orderData, totalWeightGrams) => {
  try {
    const isCOD = orderData.paymentOption === "PARTIAL_COD";
    
    // Database is in standard Rupees, so we pass it directly to Delhivery
    const codAmountToCollect = isCOD ? orderData.balanceDueOnDelivery : 0;
    const subTotalRupees = orderData.subTotal;   const safeWeight = totalWeightGrams > 0 ? totalWeightGrams : 500; 
    // Strip out +91, spaces, and dashes. Grab exactly 10 digits.
    const cleanPhone = orderData.shippingAddress.phone.replace(/\D/g, '').slice(-10);

    const shipmentPayload = {
      shipments: [
        {
          name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`.trim(),
          add: orderData.shippingAddress.street,
          pin: orderData.shippingAddress.pinCode,
          city: orderData.shippingAddress.city,
          state: orderData.shippingAddress.state,
          country: orderData.shippingAddress.country,
          phone: cleanPhone,
          order: orderData.orderNumber,
          
          payment_mode: isCOD ? "COD" : "Pre-paid",
          cod_amount: codAmountToCollect,
          total_amount: subTotalRupees,           
          quantity: orderData.items.reduce((acc, item) => acc + item.quantity, 0).toString(),
          weight: safeWeight.toString(),
        }
      ],
      pickup_location: {
        // MUST perfectly match your Delhivery Dashboard (Settings > Pickup Locations)
        name: process.env.DELHIVERY_WAREHOUSE_NAME || "Primary Warehouse" 
      }
    };

    // Delhivery requires application/x-www-form-urlencoded
    const payloadParams = new URLSearchParams();
    payloadParams.append("format", "json");
    payloadParams.append("data", JSON.stringify(shipmentPayload));

    const response = await delhiveryAPI.post("/api/cmu/create.json", payloadParams, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const resData = response.data;

    // Handle root-level rejection from Delhivery (Type-checking applied to bypass booleans)
    if (resData.success === false || resData.error === true || resData.error === "true") {
      let extractedError = "Invalid payload or warehouse configuration.";
      
      if (resData.rmks) {
        extractedError = typeof resData.rmks === "string" ? resData.rmks : JSON.stringify(resData.rmks);
      } else if (resData.error && typeof resData.error === "string" && resData.error !== "true") {
        extractedError = resData.error;
      }
      
      throw new Error(extractedError);
    }
    
    const packageData = resData.packages?.[0];
    
    // Extract exact error strings if the specific package was rejected
    if (!packageData || packageData.status !== "Success") {
      let specificError = "Courier rejected the shipment details.";
      if (Array.isArray(packageData?.remarks)) {
        specificError = packageData.remarks.join(" | "); 
      } else if (packageData?.remarks) {
        specificError = typeof packageData.remarks === "string" ? packageData.remarks : JSON.stringify(packageData.remarks);
      } else if (packageData?.client_error) {
        specificError = packageData.client_error;
      }
      throw new Error(specificError);
    }

    return {
      success: true,
      waybill: packageData.waybill,
      courierName: "Delhivery",
      labelUrl: packageData.routing_code ? `https://track.delhivery.com/downloads/label_${packageData.waybill}.pdf` : null
    };

  } catch (error) {
    let exactError = error.message;

    // If Axios caught an HTTP error (400/500), extract the exact string safely
    if (error.response && error.response.data) {
      const errData = error.response.data;
      if (errData.rmks) {
        exactError = typeof errData.rmks === "string" ? errData.rmks : JSON.stringify(errData.rmks);
      } else if (errData.error && typeof errData.error === "string" && errData.error !== "true") {
        exactError = errData.error;
      }
    }

    console.error("[Delhivery] Create Shipment Failed:", exactError);
    throw new Error(exactError || "Failed to dispatch order to courier.");
  }
};

/**
 * Track Shipment
 * Fetches the live location timeline of the box.
 */
export const trackShipment = async (waybill) => {
  try {
    const response = await delhiveryAPI.get(`/api/v1/packages/json/?waybill=${waybill}&ref_ids=`);
    
    const shipmentData = response.data.ShipmentData?.[0]?.Shipment;
    if (!shipmentData) throw new Error("Tracking data not found for this Waybill.");

    return {
      status: shipmentData.Status?.Status, 
      instructions: shipmentData.Status?.Instructions,
      statusDateTime: shipmentData.Status?.StatusDateTime,
      destination: shipmentData.Destination,
      pickupDate: shipmentData.PickUpDate,
    };
  } catch (error) {
    console.error("[Delhivery] Tracking Failed:", error.message);
    throw new Error("Unable to fetch live tracking data at this time.");
  }
};

/**
 * Generate PDF Label (Fallback)
 * Only use this if the labelUrl wasn't generated during createShipment.
 */
export const generateShippingLabel = async (waybill) => {
  try {
    const response = await delhiveryAPI.get(`/api/p/packing_slip?wbns=${waybill}&pdf=true`);
    
    if (response.data?.pdf_download_link) {
      return response.data.pdf_download_link;
    }
    
    throw new Error("Label URL not returned by provider.");
  } catch (error) {
    console.error("[Delhivery] Generate Label Failed:", error.message);
    throw new Error("Failed to fetch shipping label.");
  }
};