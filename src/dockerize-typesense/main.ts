import axios from 'axios';
import * as dotenv from 'dotenv';
import _ from 'lodash';

import { TYPESENSE_PORT } from './config';
import createCollections from './create-collections';
import getTypesenseAdminKey from './get-typesense-admin-key';
import getTypesenseBootstrapKey from './get-typesense-bootstrap-key';
import getTypesenseSearchKey from './get-typesense-search-key';
import prepareDotenvBlank from './prepare-dotenv-blank';
import startTypesense from './start-typesense';
import stopTypesense from './stop-typesense';

const { toString } = _;

export default async function main() {
  try {
    prepareDotenvBlank();

    // Load existing .env file
    dotenv.config();

    const [bootstrapKey, isBootstrap] = getTypesenseBootstrapKey();

    const client = axios.create({
      baseURL: `http://localhost:${TYPESENSE_PORT}`,
    });

    await startTypesense(client, bootstrapKey);

    const adminKey = await getTypesenseAdminKey(
      client,
      bootstrapKey,
      isBootstrap,
    );

    await createCollections(client, adminKey);

    await getTypesenseSearchKey(client, adminKey, isBootstrap);
  } catch (error) {
    console.error(error);
    console.log(toString(error));
    stopTypesense();
  }
}
