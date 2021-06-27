const express = require("express");
const router = express.Router();
const Helpers = require("../helpers/Helpers");
let jwt = require("jsonwebtoken");
const { route } = require("./user");
const videoHelpers = require("../helpers/videoHelpers");
const { response } = require("express");
const verifyJWT = (req, res, next) => {
  const token = req.headers["x-access-token"];
  const starToken = req.headers["x-access-token"];
  if (token == undefined) {
    res.send("Not authenticated");
  } else if (token) {
    jwt.verify(token, "adminSecret", (err, decoded) => {
      if (err) {
        console.log(err);
        res.json({ auth: false, message: "Failed to authenticate" });
      } else {
        console.log("decoded", decoded);
        next();
      }
    });
  }
};
router.get("/", verifyJWT, (req, res) => {
  console.log("gks");
});
router.post("/login", (req, res) => {
  console.log(req.body);
  Helpers.adminLogin(req.body)
    .then(() => {
      let token = jwt.sign(req.body, "adminSecret", {
        expiresIn: 6000000000000,
      });
      res.json({ token: token });
    })
    .catch(() => {
      res.json(false);
    });
});
router.get("/users", (req, res) => {
  Helpers.getAllUser().then((data) => {
    res.json(data);
  });
});
router.get("/channels", (req, res) => {
  Helpers.getAllChannels().then((data) => {
    res.json(data);
  });
});
router.get("/user-block", (req, res) => {
  let id = req.query.id;
  Helpers.blockUser(id).then((response) => {
    res.json(response);
  });
});
router.get("/user-unblock", (req, res) => {
  let id = req.query.id;
  Helpers.unbockUser(id).then((response) => {
    res.json(response);
  });
});
router.get("/channel-verify", (req, res) => {
  let id = req.query.id;
  videoHelpers.Verify(id).then((response) => {
    res.json(response);
  });
});
router.get("/Reported",(req,res)=>{
videoHelpers.getAllReported().then((response)=>{
  console.log(response);
    res.json(response)
})
});
router.get("/video-block", (req, res) => {
    let id = req.query.id;
    Helpers.blockVideo(id).then((response) => {
      res.json(response);
    });
  });
  router.get("/video-unblock", (req, res) => {
    let id = req.query.id;
    Helpers.unbockVideo(id).then((response) => {
      console.log(response,"");
      res.json(response);
    });
  });

module.exports = router;
