import { GameDig } from "gamedig";

import createLogger from "utils/logger";
import getServiceWidget from "utils/config/service-helpers";

const proxyName = "gamedigProxyHandler";
const logger = createLogger(proxyName);

export default async function gamedigProxyHandler(req, res) {
  const { group, service, index } = req.query;
  const serviceWidget = await getServiceWidget(group, service, index);
  const url = new URL(serviceWidget.url);

  try {
    const serverData = await GameDig.query({
      type: serviceWidget.serverType,
      host: url.hostname,
      port: url.port,
      givenPortOnly: true,
      checkOldIDs: true,
    });

    res.status(200).send({
      online: true,
      name: serverData.name,
      map: serverData.map,
      players: serverData.numplayers ?? serverData.players?.length,
      maxplayers: serverData.maxplayers,
      bots: serverData.bots.length,
      ping: serverData.ping,
    });
  } catch (e) {
    if (e) logger.error(e);

    res.status(200).send({
      online: false,
    });
  }
}
