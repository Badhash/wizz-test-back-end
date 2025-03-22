const express = require('express');
const bodyParser = require('body-parser');
const { Op } = require('sequelize');
const { get } = require('axios');
const db = require('./models');
const { isValidGameName, sanitizeGameName, isValidPlatform } = require('./utils');

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));

app.get('/api/games', (req, res) => db.Game.findAll()
  .then((games) => res.send(games))
  .catch((err) => {
    console.log('There was an error querying games', JSON.stringify(err));
    return res.send(err);
  }));

app.post('/api/games', (req, res) => {
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
  return db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
    .then((game) => res.send(game))
    .catch((err) => {
      console.log('***There was an error creating a game', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.delete('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => game.destroy({ force: true }))
    .then(() => res.send({ id }))
    .catch((err) => {
      console.log('***Error deleting game', JSON.stringify(err));
      res.status(400).send(err);
    });
});

app.put('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => {
      const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
      return game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
        .then(() => res.send(game))
        .catch((err) => {
          console.log('***Error updating game', JSON.stringify(err));
          res.status(400).send(err);
        });
    });
});

app.post('/api/games/search', async (req, res) => {
  try {
    const { name, platform } = req.body;
    const where = {};

    if (isValidGameName(name)) {
      where.name = {
        [Op.like]: `%${sanitizeGameName(name)}%`,
      };
    }

    if (isValidPlatform(platform)) {
      where.platform = platform;
    }

    const games = await db.Game.findAll({
      where,
    });

    return res.send(games);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'An error occurred during search' });
  }
});

app.post('/api/games/populate', async (req, res) => {
  try {
    const [androidResponse, iosResponse] = await Promise.all([
      get('https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/android.top100.json'),
      get('https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/ios.top100.json'),
    ]);

    // For each rank we have 3 games, ex. for data.rank = [{}, {}, {}]
    // I've taken the liberty to flatten the array to make it easier to work with
    // If we only need the first game of each rank, I need to change the logic by taking the first element of each rank
    const androidGames = androidResponse.data.flat();
    const iosGames = iosResponse.data.flat();

    //TODO
    //Validate if the data is correct
    //Check if each field is valid if not do not take the object into consideration

    const androidGamesFormated = androidGames.map((game) => ({
      publisherId: game.publisher_id,
      name: game.name,
      platform: 'android',
      storeId: game.appId ?? '', // TODO check what's the correct field
      bundleId: game.bundle_id,
      appVersion: game.version,
      isPublished: !!game.publisher_profile_url,
    }));

    const iosGamesFormated = iosGames.map((game) => ({
      publisherId: game.publisher_id,
      name: game.name,
      platform: 'ios',
      storeId: game.appId ?? '', // TODO check what's the correct field
      bundleId: game.bundle_id,
      appVersion: game.version,
      isPublished: !!game.publisher_profile_url,
    }));

    const allGames = [...androidGamesFormated, ...iosGamesFormated];

    const BATCH_SIZE = 10;
    for (let i = 0; i < allGames.length; i += BATCH_SIZE) {
      const batch = allGames.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(game =>
        allGames.map(async ({
                              publisherId,
                              name,
                              platform,
                              storeId,
                              bundleId,
                              appVersion,
                              isPublished,
                            }) => {
          await db.Game.findOrCreate({
            where: {
              storeId,
              platform,
            },
            defaults: {
              publisherId,
              name,
              platform,
              storeId,
              bundleId,
              appVersion,
              isPublished,
            },
          });
        })
      ));
    }

    res.status(200).send('ok');
  } catch (error) {
    console.error('Population error:', error);
    res.status(500).json({ error });
  }
});

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});

module.exports = app;
