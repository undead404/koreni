import generateKey from './generate-key';
import writeEnvironmentValues from './write-environment-values';

export default function getTypesenseBootstrapKey(): [string, boolean] {
  if (
    process.env.TYPESENSE_BOOTSTRAP_KEY &&
    process.env.TYPESENSE_BOOTSTRAP_KEY !== 'xyz'
  ) {
    console.log('Bootstrap key already exists.');
    return [process.env.TYPESENSE_BOOTSTRAP_KEY, false];
  }
  const bootstrapKey = generateKey();

  writeEnvironmentValues({
    TYPESENSE_BOOTSTRAP_KEY: bootstrapKey,
  });
  console.log('Bootstrap key generated and saved to .env file.');
  return [bootstrapKey, true];
}
