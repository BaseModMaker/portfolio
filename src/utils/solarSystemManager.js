import solarSystemsData from '../data/solarSystemsData.json';

export const SOLAR_SYSTEMS = {
  PERSONAL: 'personal',
  BACHELOR: 'bachelor',
  MASTER: 'master',
  PROFESSIONAL: 'professional'
};

export const solarSystemsConfig = solarSystemsData.solarSystems;

export function getCurrentSystemData(systemId) {
  const system = solarSystemsData.solarSystems.find(sys => sys.id === systemId);
  return system || solarSystemsData.solarSystems[0];
}

export function getSystemConfig(systemId) {
  return getCurrentSystemData(systemId);
}

export function getNextSystemId(currentSystemId) {
  const currentIndex = solarSystemsConfig.findIndex(config => config.id === currentSystemId);
  const nextIndex = (currentIndex + 1) % solarSystemsConfig.length;
  return solarSystemsConfig[nextIndex].id;
}

export function getPreviousSystemId(currentSystemId) {
  const currentIndex = solarSystemsConfig.findIndex(config => config.id === currentSystemId);
  const prevIndex = (currentIndex - 1 + solarSystemsConfig.length) % solarSystemsConfig.length;
  return solarSystemsConfig[prevIndex].id;
}