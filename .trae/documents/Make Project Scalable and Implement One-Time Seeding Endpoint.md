## Implementation Plan for Scalability and One-Time Seeding

To make the project more scalable and implement a controlled seeding process, I will perform the following steps:

### 1. Database & Model Optimizations

* **Create** **`SystemConfig`** **Model**: Introduce a new model to store global system configuration, specifically to track if the database has been seeded. This is more robust than just checking for existing data.

* **Verify Model Indexes**: Review and add necessary MongoDB indexes to `Customer`, `Product`, and `Order` models to ensure query performance as the data grows.

### 2. Refactor Seeding Logic

* **Create Seeding Service**: Move the logic from `scripts/seed-retailer.ts` into a dedicated service function in `src/lib/seed-service.ts`. This allows the logic to be reused by both the CLI script and the new API endpoint.

* **Add "Already Seeded" Check**: Modify the seeding logic to check the `SystemConfig` (or the existence of a default retailer) before proceeding. If already seeded, it will return a specific message instead of recreating the data.

### 3. Create Public Seeding Endpoint

* **Implement** **`app/api/seed/route.ts`**: Create a new public GET/POST endpoint that:

  1. Connects to the database using the existing cached connection.
  2. Calls the seeding service.
  3. Returns a success message if seeding was performed, or a "Already seeded" message if it was skipped.
  4. Updates the `SystemConfig` upon successful first-time seeding.

### 4. Scalability Enhancements

* **Global Connection Management**: Ensure all new and refactored code follows the existing pattern in `src/lib/mongodb.ts` to prevent connection leaks.

* **API Response Standardization**: Ensure the new endpoint follows the project's standard response and error handling patterns using `ERROR_MESSAGES` and `SUCCESS_MESSAGES`.

## Verification Plan

1. **Initial Seed**: Call the `/api/seed` endpoint for the first time and verify that the default retailer is created and the `SystemConfig` is updated.
2. **Subsequent Seed**: Call the endpoint again and verify that it returns an "Already seeded" message and does not modify the existing data.
3. **CLI Verification**: Run the existing `npm run seed:retailer` script to ensure it still works correctly with the refactored logic.

