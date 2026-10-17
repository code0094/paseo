const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withKarmaHermes(appConfig) {
  return withAppBuildGradle(appConfig, (config) => {
    const marker = "react {";
    if (!config.modResults.contents.includes(marker)) {
      throw new Error("Cannot configure Karma Hermes flags: react block missing");
    }
    if (!config.modResults.contents.includes("PASEO_HERMES_LOW_MEMORY")) {
      config.modResults.contents = config.modResults.contents.replace(
        marker,
        `${marker}\n    if (System.getenv("PASEO_HERMES_LOW_MEMORY") == "1") {\n        hermesFlags = ["-Og", "-output-source-map"]\n    }`,
      );
    }
    return config;
  });
};
