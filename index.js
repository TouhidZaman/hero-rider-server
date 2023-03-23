const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
require("dotenv").config();
var cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4b4unae.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const database = client.db("heroRiderDB");
    const userCollection = database.collection("users");

    /*
    ###################################################
    ################ users API's ###################
    ###################################################
    */

    // Add new user
    app.post("/users", async (req, res) => {
      const user = req.body;
      try {
        const result = await userCollection.insertOne(user);
        res.status(200).json(result);
      } catch (err) {
        res.status(500).json(err);
      }
    });

    // get all users
    app.get("/users", async (req, res) => {
      let query = {};
      let ageRangeQuery = {};
      let searchQuery = {};

      const limit = +req.query.limit;
      const page = +req.query.page;
      const search = req.query.search;
      const ageBetween = req.query.ageBetween;

      //Forming search query
      if (search) {
        searchQuery = {
          $or: [
            {
              displayName: {
                $regex: search,
                $options: "i",
              },
            },
            {
              email: {
                $regex: search,
                $options: "i",
              },
            },
            {
              phoneNumber: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        };
      }

      //Adding range query
      if (ageBetween !== "") {
        const splittedAge = ageBetween.split("-");
        const startAge = +splittedAge[0];
        const endAge = +splittedAge[1];
        ageRangeQuery = {
          age: { $gte: startAge, $lte: endAge },
        };
      }

      //combining filter queries
      query = {
        $and: [searchQuery, ageRangeQuery],
      };

      try {
        const count = await userCollection.estimatedDocumentCount();
        const users = await userCollection
          .find(query)
          .skip(page * limit)
          .limit(limit)
          .toArray();
        res.status(200).json({ count, users });
      } catch (err) {
        res.status(500).json(err);
      }
    });

    // get user by email
    app.get("/users/email/:email", async (req, res) => {
      try {
        const query = { email: req.params.email };
        const user = await userCollection.findOne(query);
        res.status(200).json(user);
      } catch (err) {
        res.status(500).json(err);
      }
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.status(200).json({
    server: "hero-rider-server",
    message: "welcome",
    author: {
      name: "Muhammad Touhiduzzaman",
      email: "touhid4bd@gmail.com",
      website: "http://touhid-zaman.web.app/",
    },
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
