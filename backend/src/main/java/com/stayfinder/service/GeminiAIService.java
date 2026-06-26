package com.stayfinder.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiAIService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.enabled:true}")
    private boolean enabled;

    private static final String GEMINI_API_URL = 
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    private final RestTemplate restTemplate = new RestTemplate();

    // Simple in-memory cache to reduce API calls
    private final Map<String, String> cache = new java.util.concurrent.ConcurrentHashMap<>();
    private static final int MAX_CACHE_SIZE = 100;

    /**
     * Generate property description using AI
     */
    public String generatePropertyDescription(
            String propertyType,
            String city,
            String state,
            int bedrooms,
            int bathrooms,
            int maxGuests,
            List<String> amenities
    ) {
        if (!enabled) {
            log.debug("Gemini AI is disabled");
            return null;
        }

        String prompt = buildPropertyDescriptionPrompt(
            propertyType, city, state, bedrooms, bathrooms, maxGuests, amenities
        );

        return callGeminiAPI(prompt);
    }

    /**
     * Summarize reviews into one sentence
     */
    public String summarizeReviews(List<String> reviewTexts, double avgRating) {
        if (!enabled || reviewTexts.isEmpty()) {
            return null;
        }

        String prompt = buildReviewSummaryPrompt(reviewTexts, avgRating);
        return callGeminiAPI(prompt);
    }

    /**
     * Generate personalized property recommendations based on user preferences
     */
    public String generatePersonalizedRecommendations(
            List<String> previousCities,
            List<String> previousPropertyTypes,
            List<String> previousCategories,
            List<String> wishlistedCategories,
            int avgGuests,
            String searchQuery
    ) {
        if (!enabled) {
            return null;
        }

        String prompt = buildRecommendationPrompt(
            previousCities, previousPropertyTypes, previousCategories,
            wishlistedCategories, avgGuests, searchQuery
        );
        
        return callGeminiAPI(prompt);
    }

    /**
     * Interpret natural language search query and extract structured search parameters
     */
    public Map<String, String> interpretSearchQuery(String naturalQuery) {
        if (!enabled || naturalQuery == null || naturalQuery.isBlank()) {
            return Map.of();
        }

        // Check cache first
        String cacheKey = "search:" + naturalQuery.toLowerCase().trim();
        String cachedResponse = cache.get(cacheKey);
        if (cachedResponse != null) {
            log.debug("Using cached search interpretation for: {}", naturalQuery);
            return parseSearchInterpretation(cachedResponse);
        }

        String prompt = buildSearchInterpretationPrompt(naturalQuery);
        String response = callGeminiAPI(prompt);
        
        if (response == null) {
            return Map.of();
        }

        // Cache the response
        cacheResponse(cacheKey, response);

        return parseSearchInterpretation(response);
    }

    /**
     * Generate smart price recommendation for a property
     */
    public Map<String, Object> generatePriceRecommendation(
            String city,
            String state,
            String propertyType,
            String category,
            int bedrooms,
            int bathrooms,
            int maxGuests,
            List<String> amenities,
            Double currentPrice,
            Double avgPriceInArea
    ) {
        if (!enabled) {
            return Map.of("error", "AI service disabled");
        }

        String prompt = buildPriceRecommendationPrompt(
            city, state, propertyType, category, bedrooms, bathrooms,
            maxGuests, amenities, currentPrice, avgPriceInArea
        );

        String response = callGeminiAPI(prompt);
        
        if (response == null) {
            return Map.of("error", "Failed to generate recommendation");
        }

        return parsePriceRecommendation(response);
    }

    /**
     * Build prompt for property description
     */
    private String buildPropertyDescriptionPrompt(
            String propertyType,
            String city,
            String state,
            int bedrooms,
            int bathrooms,
            int maxGuests,
            List<String> amenities
    ) {
        String amenitiesList = amenities != null && !amenities.isEmpty() 
            ? String.join(", ", amenities) 
            : "basic amenities";

        return String.format("""
            Write a compelling, professional property description for a vacation rental listing.
            
            Property Details:
            - Type: %s
            - Location: %s, %s
            - Bedrooms: %d
            - Bathrooms: %d
            - Max Guests: %d
            - Amenities: %s
            
            Requirements:
            - Write 5-6 sentences (minimum 150 words, maximum 200 words)
            - Start with an exciting hook about the property or location
            - Describe the space and what makes it special
            - Highlight key amenities and features guests will love
            - Mention the neighborhood or nearby attractions
            - End with who this property is perfect for (families, couples, business travelers, etc.)
            - Be enthusiastic, warm, and inviting
            - Do NOT use markdown, bullet points, or special formatting
            - Do NOT include price or booking information
            - Write in flowing paragraph form only
            
            Write only the description paragraph, nothing else.
            """,
            propertyType, city, state, bedrooms, bathrooms, maxGuests, amenitiesList
        );
    }

    /**
     * Build prompt for review summary
     */
    private String buildReviewSummaryPrompt(List<String> reviewTexts, double avgRating) {
        String allReviews = String.join("\n---\n", reviewTexts);
        
        return String.format("""
            Summarize these property reviews into ONE concise sentence (15-20 words).
            
            Average Rating: %.1f/5.0
            
            Reviews:
            %s
            
            Requirements:
            - ONE sentence only
            - Highlight the most common positive themes
            - Be specific (mention what guests loved: location, cleanliness, host, etc.)
            - Keep it natural and conversational
            - Don't use quotes or special formatting
            
            Example: "Guests loved the spotless rooms, central location, and the host's warm hospitality."
            
            Write only the summary sentence, nothing else.
            """,
            avgRating, allReviews
        );
    }

    /**
     * Build prompt for personalized recommendations
     */
    private String buildRecommendationPrompt(
            List<String> previousCities,
            List<String> previousPropertyTypes,
            List<String> previousCategories,
            List<String> wishlistedCategories,
            int avgGuests,
            String searchQuery
    ) {
        String prevCities = previousCities.isEmpty() ? "None" : String.join(", ", previousCities);
        String prevTypes = previousPropertyTypes.isEmpty() ? "None" : String.join(", ", previousPropertyTypes);
        String prevCats = previousCategories.isEmpty() ? "None" : String.join(", ", previousCategories);
        String wishCats = wishlistedCategories.isEmpty() ? "None" : String.join(", ", wishlistedCategories);
        
        return String.format("""
            Based on a user's travel history and preferences, generate a brief personalized recommendation message (2-3 sentences, 40-60 words).
            
            User Profile:
            - Previously visited cities: %s
            - Previously booked property types: %s
            - Previously booked categories: %s
            - Wishlisted categories: %s
            - Average group size: %d guests
            - Current search: %s
            
            Requirements:
            - Write 2-3 sentences (40-60 words total)
            - Be warm and personalized
            - Suggest property types or locations they might enjoy
            - Reference their past preferences naturally
            - Don't use special formatting or emojis
            - Be conversational and helpful
            
            Example: "Based on your love for beach properties, you might enjoy our coastal villas in Goa. Since you usually travel with 4 guests, we've highlighted spacious family-friendly homes with great amenities."
            
            Write only the recommendation text, nothing else.
            """,
            prevCities, prevTypes, prevCats, wishCats, avgGuests, 
            searchQuery != null && !searchQuery.isBlank() ? searchQuery : "browsing properties"
        );
    }

    /**
     * Build prompt for natural language search interpretation
     */
    private String buildSearchInterpretationPrompt(String naturalQuery) {
        return String.format("""
            Interpret this natural language property search query and extract structured search parameters.
            
            User Query: "%s"
            
            Extract the following if mentioned (leave blank if not mentioned):
            - CITY: City name
            - CATEGORY: One of (BEACH, MOUNTAIN, CITY, COUNTRYSIDE, LAKEFRONT, UNIQUE, HERITAGE, CAMPING)
            - PROPERTY_TYPE: One of (ENTIRE_HOME, PRIVATE_ROOM, SHARED_ROOM)
            - GUESTS: Number of guests
            - KEYWORDS: Key features or amenities mentioned
            
            Requirements:
            - Extract only what is explicitly mentioned or strongly implied
            - Use exact category/type names from the lists above
            - For KEYWORDS, list comma-separated features (e.g., "pool, wifi, parking")
            - Format your response EXACTLY as shown below
            - Use "NONE" if a field is not mentioned
            
            Response Format (use this exact format):
            CITY: [city name or NONE]
            CATEGORY: [category or NONE]
            PROPERTY_TYPE: [type or NONE]
            GUESTS: [number or NONE]
            KEYWORDS: [comma-separated keywords or NONE]
            
            Examples:
            Query: "romantic beachfront villa for honeymoon"
            CITY: NONE
            CATEGORY: BEACH
            PROPERTY_TYPE: ENTIRE_HOME
            GUESTS: 2
            KEYWORDS: romantic, honeymoon, beachfront
            
            Query: "family home in Mumbai with pool"
            CITY: Mumbai
            CATEGORY: CITY
            PROPERTY_TYPE: ENTIRE_HOME
            GUESTS: 4
            KEYWORDS: pool, family
            
            Now interpret the user query and respond in the exact format above.
            """,
            naturalQuery
        );
    }

    /**
     * Build prompt for smart price recommendation
     */
    private String buildPriceRecommendationPrompt(
            String city,
            String state,
            String propertyType,
            String category,
            int bedrooms,
            int bathrooms,
            int maxGuests,
            List<String> amenities,
            Double currentPrice,
            Double avgPriceInArea
    ) {
        String amenitiesList = amenities != null && !amenities.isEmpty() 
            ? String.join(", ", amenities) 
            : "basic amenities";
        
        String currentPriceStr = currentPrice != null 
            ? String.format("₹%.0f", currentPrice) 
            : "Not set";
        
        String avgPriceStr = avgPriceInArea != null 
            ? String.format("₹%.0f", avgPriceInArea) 
            : "Unknown";

        // Get current month for seasonal analysis
        java.time.Month currentMonth = java.time.LocalDate.now().getMonth();
        String season = getSeason(currentMonth);

        return String.format("""
            You are a vacation rental pricing expert in India. Provide a smart price recommendation.
            
            Property Details:
            - Location: %s, %s
            - Type: %s
            - Category: %s
            - Bedrooms: %d, Bathrooms: %d
            - Max Guests: %d
            - Amenities: %s
            - Current Price: %s per night
            - Average Price in Area: %s per night
            - Current Season: %s
            
            Consider: location demand, amenities, seasonal factors, market comparison, capacity.
            All prices must be realistic Indian Rupee amounts (e.g., 1500 to 15000 range for most properties).
            
            Respond in this EXACT format with no extra text before or after:
            RECOMMENDED_PRICE: [number only, no symbols]
            WEEKEND_PRICE: [number only, no symbols]
            MIN_PRICE: [number only, no symbols]
            MAX_PRICE: [number only, no symbols]
            CONFIDENCE: [HIGH, MEDIUM, or LOW]
            REASONING: [2 sentences max explaining the recommendation]
            TIPS: [tip 1]; [tip 2]; [tip 3]
            """,
            city, state, propertyType, category, bedrooms, bathrooms,
            maxGuests, amenitiesList, currentPriceStr, avgPriceStr, season
        );
    }

    /**
     * Get season based on month
     */
    private String getSeason(java.time.Month month) {
        return switch (month) {
            case DECEMBER, JANUARY, FEBRUARY -> "Winter (Peak tourist season)";
            case MARCH, APRIL, MAY -> "Summer (Hot, moderate demand)";
            case JUNE, JULY, AUGUST, SEPTEMBER -> "Monsoon (Off-peak season)";
            case OCTOBER, NOVEMBER -> "Autumn (Festival season, high demand)";
        };
    }

    /**
     * Parse AI response for search interpretation
     */
    private Map<String, String> parseSearchInterpretation(String response) {
        Map<String, String> result = new java.util.HashMap<>();
        
        try {
            String[] lines = response.split("\n");
            for (String line : lines) {
                if (line.contains(":")) {
                    String[] parts = line.split(":", 2);
                    if (parts.length == 2) {
                        String key = parts[0].trim().toUpperCase();
                        String value = parts[1].trim();
                        
                        if (!value.equalsIgnoreCase("NONE") && !value.isBlank()) {
                            result.put(key, value);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse search interpretation: {}", e.getMessage());
        }
        
        return result;
    }

    /**
     * Parse AI response for price recommendation
     */
    private Map<String, Object> parsePriceRecommendation(String response) {
        Map<String, Object> result = new java.util.HashMap<>();
        
        try {
            String[] lines = response.split("\n");
            StringBuilder reasoning = new StringBuilder();
            StringBuilder tips = new StringBuilder();
            boolean inReasoning = false;
            boolean inTips = false;
            
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty()) continue;
                
                if (line.startsWith("RECOMMENDED_PRICE:")) {
                    result.put("recommendedPrice", extractNumber(line));
                    inReasoning = false;
                    inTips = false;
                } else if (line.startsWith("WEEKEND_PRICE:")) {
                    result.put("weekendPrice", extractNumber(line));
                    inReasoning = false;
                    inTips = false;
                } else if (line.startsWith("MIN_PRICE:")) {
                    result.put("minPrice", extractNumber(line));
                    inReasoning = false;
                    inTips = false;
                } else if (line.startsWith("MAX_PRICE:")) {
                    result.put("maxPrice", extractNumber(line));
                    inReasoning = false;
                    inTips = false;
                } else if (line.startsWith("CONFIDENCE:")) {
                    result.put("confidence", extractValue(line));
                    inReasoning = false;
                    inTips = false;
                } else if (line.startsWith("REASONING:")) {
                    reasoning.append(extractValue(line));
                    inReasoning = true;
                    inTips = false;
                } else if (line.startsWith("TIPS:")) {
                    tips.append(extractValue(line));
                    inReasoning = false;
                    inTips = true;
                } else if (inReasoning) {
                    reasoning.append(" ").append(line);
                } else if (inTips) {
                    tips.append(" ").append(line);
                }
            }
            
            if (reasoning.length() > 0) {
                result.put("reasoning", reasoning.toString().trim());
            }
            if (tips.length() > 0) {
                String tipsStr = tips.toString().trim();
                List<String> tipsList = java.util.Arrays.asList(tipsStr.split(";"));
                result.put("tips", tipsList.stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(java.util.stream.Collectors.toList()));
            }
            
        } catch (Exception e) {
            log.error("Failed to parse price recommendation: {}", e.getMessage());
        }
        
        return result;
    }

    /**
     * Extract number from line like "RECOMMENDED_PRICE: 3500"
     */
    private Double extractNumber(String line) {
        try {
            String value = line.substring(line.indexOf(":") + 1).trim();
            // Remove any currency symbols or commas
            value = value.replaceAll("[₹,]", "").trim();
            return Double.parseDouble(value);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Extract value from line like "CONFIDENCE: HIGH"
     */
    private String extractValue(String line) {
        try {
            return line.substring(line.indexOf(":") + 1).trim();
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Call Gemini API
     */
    private String callGeminiAPI(String prompt) {
        try {
            String url = GEMINI_API_URL + "?key=" + apiKey;

            // Build request body
            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", prompt)
                    ))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.7,
                    "maxOutputTokens", 600,
                    "topP", 0.8,
                    "topK", 40
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Map.class
            );

            // Extract text from response
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    
                    if (parts != null && !parts.isEmpty()) {
                        String text = (String) parts.get(0).get("text");
                        return text != null ? text.trim() : null;
                    }
                }
            }

            log.warn("Gemini API returned unexpected response format");
            return null;

        } catch (Exception e) {
            log.error("Failed to call Gemini API: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Cache response to reduce API calls
     */
    private void cacheResponse(String key, String value) {
        if (cache.size() >= MAX_CACHE_SIZE) {
            // Simple eviction: clear oldest entries
            cache.clear();
        }
        cache.put(key, value);
    }
}
