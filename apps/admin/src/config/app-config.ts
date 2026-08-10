import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Strandhager",
  version: packageJson.version,
  copyright: `© ${currentYear}, Strandhager.`,
  meta: {
    title: "Strandhager Admin",
    description: "Administrasjonspanel for hyttebooking.",
  },
};
