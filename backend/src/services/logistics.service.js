import axios from "axios";

// Create a centralized Axios client for Delhivery
const delhiveryAPI = axios.create({
  baseURL: process.env.DELHIVERY_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Token ${process.env.DELHIVERY_API_KEY}`,
  },
});

/**
 * 1. Check Pincode Serviceability
 * Useful for validating an address before checkout or fulfillment.
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
 * 2. Create Shipment (Fulfill Order)
 * The main engine for pushing an order to Delhivery.
 */
export const createShipment = async (orderData, totalWeightGrams) => {
  try {
    // Delhivery strictly requires the COD amount to be the balance due. 
    // If it's FULL_ONLINE, this will correctly evaluate to 0.
    const isCOD = orderData.paymentOption === "PARTIAL_COD";
    const codAmountToCollect = isCOD ? orderData.balanceDueOnDelivery : 0;
    
    // Delhivery accepts weight in grams. 
    // If it exceeds a certain limit (e.g., 10kg), they automatically route it to Surface Heavy.
    const safeWeight = totalWeightGrams > 0 ? totalWeightGrams : 500; 

    const payload = {
      format: "json",
      data: {
        shipments: [
          {
            name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
            add: orderData.shippingAddress.street,
            pin: orderData.shippingAddress.pinCode,
            city: orderData.shippingAddress.city,
            state: orderData.shippingAddress.state,
            country: orderData.shippingAddress.country,
            phone: orderData.shippingAddress.phone,
            order: orderData.orderNumber,
            
            // Format strictly to Delhivery's enums
            payment_mode: isCOD ? "COD" : "Pre-paid",
            cod_amount: codAmountToCollect,
            total_amount: orderData.subTotal, // The actual value of the goods
            
            quantity: orderData.items.reduce((acc, item) => acc + item.quantity, 0).toString(),
            weight: safeWeight.toString(),
          }
        ],
        pickup_location: {
          // This MUST match the Warehouse Name registered in your Delhivery Dashboard
          name: process.env.DELHIVERY_WAREHOUSE_NAME || "Primary Warehouse" 
        }
      }
    };

    // The standard API endpoint for creating a shipment and getting a waybill instantly
    const response = await delhiveryAPI.post("/api/cbs/v1.2/shipment/create/", payload);
    
    const packageData = response.data.packages?.[0];
    
    if (!packageData || packageData.status !== "Success") {
      throw new Error(packageData?.remarks || "Courier rejected the shipment payload.");
    }

    return {
      success: true,
      waybill: packageData.waybill,
      courierName: "Delhivery",
      labelUrl: packageData.routing_code ? `https://track.delhivery.com/downloads/label_${packageData.waybill}.pdf` : null
    };

  } catch (error) {
    console.error("[Delhivery] Create Shipment Failed:", error?.response?.data || error.message);
    throw new Error("Failed to dispatch order to courier.");
  }
};

/**
 * 3. Track Shipment
 * Fetches the live location timeline of the box.
 */
export const trackShipment = async (waybill) => {
  try {
    const response = await delhiveryAPI.get(`/api/v1/packages/json/?waybill=${waybill}&ref_ids=`);
    
    const shipmentData = response.data.ShipmentData?.[0]?.Shipment;
    if (!shipmentData) throw new Error("Tracking data not found for this Waybill.");

    return {
      status: shipmentData.Status?.Status, // e.g., "In Transit", "Delivered", "RTO Delivered"
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
 * 4. Generate PDF Label (Fallback)
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