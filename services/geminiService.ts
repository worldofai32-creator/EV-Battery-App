import { GoogleGenAI, Type } from "@google/genai";
import { ChargingStation, EstimationResponse, StationResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// 1. Get EV Range and Time Estimates based on battery
export const getEVEstimates = async (
  batteryPercentage: number,
  currentTime: string
): Promise<EstimationResponse> => {
  try {
    const modelId = "gemini-2.5-flash";
    const prompt = `
      I have an Electric Vehicle (Generic Sedan).
      Current Battery: ${batteryPercentage}%.
      Current Time: ${currentTime}.
      
      Please estimate:
      1. Remaining Range in KM (assume avg efficiency).
      2. Remaining Time in Hours (assuming highway driving at 90km/h).
      3. A short, 1-sentence note about efficiency based on time of day or typical conditions.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rangeKm: { type: Type.NUMBER },
            timeLeftHours: { type: Type.NUMBER },
            efficiencyNote: { type: Type.STRING },
          },
          required: ["rangeKm", "timeLeftHours", "efficiencyNote"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");
    return JSON.parse(jsonText) as EstimationResponse;

  } catch (error) {
    console.error("Error fetching EV estimates:", error);
    // Fallback if AI fails
    return {
      rangeKm: batteryPercentage * 3.5, // Rough fallback
      timeLeftHours: (batteryPercentage * 3.5) / 90,
      efficiencyNote: "AI unavailable, showing rough estimates.",
    };
  }
};

// 2. Find Nearby Charging Stations using Google Maps Grounding
export const findNearbyStations = async (
  latitude: number,
  longitude: number
): Promise<StationResponse> => {
  try {
    const modelId = "gemini-2.5-flash";
    
    // Prompt engineered for parsing to get rich details that might not be in raw chunks
    const prompt = `
      Find the 3 nearest EV charging stations to my location (${latitude}, ${longitude}).
      
      For each station, strictly output a single line with this format:
      Name|Address|Rating|Status
      
      - Name: Name of the station
      - Address: Full address
      - Rating: Number (e.g., 4.5), or "N/A" if not available
      - Status: "Open" if currently open, "Closed" if closed, or "Unknown"
      
      Do not add introductory text or markdown styling like bolding. Just the list of pipe-separated values.
    `;

    // Maps Grounding Config
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude,
              longitude,
            },
          },
        },
      },
    });

    const fullText = response.text || "No station information available.";
    
    // 1. Parse the text response for details (Name|Address|Rating|Status)
    const lines = fullText.split('\n').filter(line => line.includes('|') && line.split('|').length >= 3);
    
    let parsedStations: ChargingStation[] = lines.map(line => {
        const parts = line.split('|').map(s => s.trim());
        const name = parts[0] || "Unknown Station";
        const address = parts[1] || "Address unavailable";
        const ratingVal = parseFloat(parts[2]);
        const rating = !isNaN(ratingVal) ? ratingVal : undefined;
        const statusStr = parts[3] || "";
        const openNow = statusStr.toLowerCase().includes('open');

        return {
            name,
            address,
            rating,
            openNow,
            uri: "" // To be filled by chunks logic
        };
    });

    // 2. Extract Grounding Chunks for accurate URIs
    // @ts-ignore
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapChunks = chunks
      .map((chunk: any) => chunk.maps)
      .filter((m: any) => !!m);

    // 3. Merge Parsed Data with Map Chunks
    // We match by name similarity or fallback to index order
    if (parsedStations.length > 0) {
        parsedStations = parsedStations.map((station, index) => {
            // Try to find a matching chunk
            const match = mapChunks.find((c: any) => c.title && station.name.toLowerCase().includes(c.title.toLowerCase()));
            // If no name match, and we have a chunk at this index, use it (assuming order is preserved)
            const chunkToUse = match || mapChunks[index];
            
            // Generate a fallback URI if map chunk is missing but we have address
            const fallbackUri = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.name + " " + station.address)}`;

            return {
                ...station,
                uri: chunkToUse?.uri || fallbackUri
            };
        });
    } else {
        // Fallback: Parsing failed (model didn't use pipes), construct from chunks only
        parsedStations = mapChunks.map((c: any) => ({
            name: c.title || "EV Station",
            address: "View on Map for details",
            rating: undefined,
            openNow: undefined,
            uri: c.uri
        }));
    }

    return { text: fullText, stations: parsedStations };

  } catch (error) {
    console.error("Error finding stations:", error);
    return { 
      text: "Could not fetch station data at this time. Please check your internet or location permissions.", 
      stations: [] 
    };
  }
};
