const express = require("express");
const router = express.Router();
// 설정 후, 아래의 app을 전부 router로 바꿔준 후
// app.js에서  [app.use("/campgrounds", campgrounds);] 와 같이 적어준 뒤 본 파일의 코드 내 경로에서 campgrounds 모두 삭제해준다
// 추가적으로 필요한 require을 옮기고(옮길때는 경로수정 필수) 유효성검사와 같이 필요한 코드를 옮겨 추가해준다.

const catchAsync = require("../utils/catchAsync");

const { isLoggedIn, isAuthor, validateCampground } = require("../middleware");

const Campground = require("../models/campground");

// router.get("/makecampground", async (req, res) => {
//   const camp = new Campground({ title: "New Campground" });
//   await camp.save();
//   res.send(camp);
// });

router.get(
  "/",
  catchAsync(async (req, res, next) => {
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index", { campgrounds });
  })
);

router.get("/new", isLoggedIn, (req, res) => {
  res.render("campgrounds/new");
});
// new가 만약에 :id아래에 위치하면 New가 아이디로 들어가서 제대로 동작이 안됨. 순서를 위로 올려줘야함

router.post(
  "/",
  validateCampground,
  isLoggedIn,
  catchAsync(async (req, res, next) => {
    // if (!req.body.campgrounds)
    //   throw new ExpressError("invalid Campgrounds Data", 400);  기본오류구문 -> 주석처리하고 joi활용할것임

    // 몽구스로 저장하기도 전에 데이터 유효성검사가 들어감
    const campground = new Campground(req.body.campground);
    campground.author = req.user._id;
    await campground.save();
    req.flash("success", "Successfully made a new campground!");
    // show페이지의 get라우터안에서 render할때 이걸 전달해줘야 페이지 내에서 사용 가능하겠져?
    // 그렇지만.. 하나하나 다 입력하려면 너무 번거롭기 때문에 모든 요청에서 모든 정보를 받는 미들웨어를 설정해서 플래시를 전달해줄것임.(템플릿으로 전달해줘서 로컬변수로서 접근가능하도록)
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

router.get(
  "/:id",
  catchAsync(async (req, res, next) => {
    // const campground = await Campground.findById(req.params.id)
    //   .populate("reviews")
    //   .populate("author");

    // + 화면의 구성 또는 앱의 작동여부가 걱정되거나 좀 더 효율적으로 작업하고싶을 경우 리뷰마다 사용자 이름을 저장해도됨
    // + 그렇지만 계속해서 고민하기. 나는 이 데이터를 어떻게 쓸거지? 모든리뷰에 작성자를 채워넣는게 의미가 있을까? 리뷰의 숫자만이라도 제한하는건 어떨까?

    const campground = await Campground.findById(req.params.id)
      .populate({
        path: "reviews",
        populate: { path: "author", model: "User" },
      })
      .populate("author");
    console.log(campground);
    if (!campground) {
      req.flash("error", "Campground not found");
      res.redirect("/campgrounds");
      return;
    }
    res.render("campgrounds/show", { campground });
  })
);

router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  // 로그인, 권한 나눠서 넣으면 더 구체적인 피드백을 얻을 수 있음 ! 로그인안하면 로그인페이지로, 권한이없으면 메세지를
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);

    if (!campground) {
      req.flash("error", "Campground not found");
      res.redirect("/campgrounds");
      return;
    }

    res.render("campgrounds/edit", { campground });
  })
);

router.put(
  "/:id",
  isLoggedIn,
  isAuthor,
  validateCampground,
  catchAsync(async (req, res, next) => {
    // res.send("IT WORKED!");
    const { id } = req.params;

    // const campground = await Campground.findByIdAndUpdate(id,{...req.body.campground,},{ new: true }); // { new: true } -업데이트된 데이터를 받겠다. 지금은 굳이 필요없음
    const campground = await Campground.findByIdAndUpdate(
      id,
      { ...req.body.campground },
      { new: true }
    ); // { new: true } -업데이트된 데이터를 받겠다. 지금은 굳이 필요없음
    req.flash("success", "Successfully updated campground!");
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

router.delete(
  "/:id",
  isLoggedIn,
  isAuthor,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash("success", "캠프장삭제성공!");
    res.redirect("/campgrounds");
    // 일단 단순삭제. 원래는 연결된 정보도 있기때문에 검색해서 삭제하는 식으로 해야됨
  })
);

module.exports = router;
