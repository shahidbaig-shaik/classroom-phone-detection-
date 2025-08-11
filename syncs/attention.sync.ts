import Vision from "../concepts/vision.phoneuse";

export default {
  name: "Policy.Attention",
  when: async () => { 
    const last = Vision._last()[0]; 
    return !!last && last.meetsThreshold === true; 
  },
  where: () => true,
  then: async () => { 
    console.log("[ALERT] Sustained phone use", Vision._last()[0]); 
    return { notified: true }; 
  }
};
