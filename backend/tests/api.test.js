// backend/tests/api.test.js
const request = require("supertest");
const app = require("../server"); // Assuming your Express app is exported from server.js

describe("Drug API", () => {
  it("should verify a drug successfully", async () => {
    const drugId = "DRUG001";
    const res = await request(app).get(`/api/drug/verify/${drugId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("productId");
    expect(res.body).toHaveProperty("history");
  });

  it("should return 400 if manufacturing data is missing", async () => {
    const res = await request(app)
      .post("/api/drug/manufacture")
      .send({ id: "DRUG002", productId: "PRODXYZ" }); // Missing batchId
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("error", "Missing required fields");
  });
  // Add more tests for error cases, other endpoints, etc.
});
