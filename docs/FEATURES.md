# Features Guide

## 1. Household Profile & Customization
The core of Kitchen Intelligence is adaptation. The **Household Panel** allows users to define:
*   **Location**: Affects the estimated cost of meals (e.g., London prices vs. rural prices).
*   **Family Size**: Scales the ingredient quantities and cost calculations.
*   **Equipment**: Filters recipes based on available tools (e.g., "Oven", "Hob", "Microwave").
*   **Dietary Preferences**:
    *   **Vegetarian**: Excludes meat and fish.
    *   **Gluten-Free**: Excludes wheat-based products.
    *   **Nutrition Goals**: Prioritizes "High Protein" or "Balanced" meals.

## 2. AI-Powered Weekly Planner
*   **Automated Scheduling**: Generates a 7-day plan (Lunch & Dinner) instantly based on the profile.
*   **Smart Selection**: Balances meal variety to avoid repetition.
*   **Cost Estimation**: Provides a real-time estimate of the weekly grocery bill.
*   **Health Scores**: Each meal is scored (0-100) based on macro-nutrient balance.

## 3. Interactive Meal Swapping
Users are not locked into the AI's first choice.
*   **Swap Button**: Click "Swap" on any meal card to reject it.
*   **Logic**: The system instantly finds a *different* suitable recipe that fits the same nutritional and equipment constraints.
*   **Live Updates**: The total cost and grocery list update immediately without a page reload.

## 4. Shopping Mode
A dedicated view for the weekly execution.
*   **Aggregation**: Automatically combines ingredients from all planned meals (e.g., "Onion (x4)").
*   **Checklist**: Interactive UI to mark items as bought.
*   **Persistence**: Checklist state is saved to the browser's local storage, so it persists across sessions.

## 5. Cook Mode
A companion interface for the kitchen.
*   **Step-by-Step**: Focuses on one instruction at a time.
*   **Timers**: Integrated timers for time-sensitive steps (e.g., "Roast for 25 mins").
*   **Feedback Loop**: At the end of cooking, users can rate the meal ("Yummy" or "Not for us"). This data is sent to the backend to improve future recommendations.
