import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env, getMissingAwsS3EnvVars } from "./config/env.js";
import { ensureSystemRoles } from "./services/permissionService.js";

const bootstrap = async () => {
  try {
    const missingAwsS3EnvVars = getMissingAwsS3EnvVars();

    if (missingAwsS3EnvVars.length) {
      console.warn(
        `AWS S3 config incomplete. Missing: ${missingAwsS3EnvVars.join(", ")}`
      );
    }

    await connectDatabase();
    await ensureSystemRoles();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

bootstrap();
