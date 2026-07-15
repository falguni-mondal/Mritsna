import React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Sub-components
import CollectionHero from "../components/collection/CollectionHero";
import CollectionLookbook from "../components/collection/CollectionLookbook";
import CollectionGrid from "../components/collection/CollectionGrid";
import CollectionBundle from "../components/collection/CollectionBundle";

// Register ScrollTrigger globally for the page
gsap.registerPlugin(ScrollTrigger);

// --- Dummy Data ---
const collectionData = {
  title: "The Obsidian Series",
  subtitle: "Autumn / Winter 2026",
  description: "A study in raw texture and minimalist form. Fired at 1800°C, each piece absorbs ambient light, rendering deep, cinematic shadows that anchor the modern dining space.",
  heroImage: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=3200&auto=format&fit=crop",
  lookbookImage: "https://images.unsplash.com/photo-1578500494198-246f612b3b6d?q=80&w=2000&auto=format&fit=crop",
  lookbookHotspots: [
    { id: 1, top: "45%", left: "30%", title: "Obsidian Platter", price: "₹4,500" },
    { id: 2, top: "60%", left: "65%", title: "Matte Serving Bowl", price: "₹2,800" },
  ],
  products: [
    { id: "p1", name: "Obsidian Platter", price: "₹4,500", image: "https://images.unsplash.com/photo-1613521140785-e85e427f8002?q=80&w=800&auto=format&fit=crop", offset: "mt-0" },
    { id: "p2", name: "Tall Cylinder Vase", price: "₹5,200", image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?q=80&w=800&auto=format&fit=crop", offset: "lg:mt-32" },
    { id: "p3", name: "Matte Serving Bowl", price: "₹2,800", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop", offset: "lg:mt-16" },
  ]
};

const Collection = () => {
  return (
    <main className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a]">
      <CollectionHero collectionData={collectionData} />
      
      <CollectionLookbook 
        lookbookImage={collectionData.lookbookImage} 
        lookbookHotspots={collectionData.lookbookHotspots} 
      />
      
      <CollectionGrid products={collectionData.products} />
      
      <CollectionBundle />
    </main>
  );
};

export default Collection;