export function GET() {
  return Response.json(
    {
      error: {
        code: "not_configured",
        message: "Apple sign-in is designed in and stays off until APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY are set.",
      },
    },
    { status: 503 },
  );
}
