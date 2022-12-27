const gameWidth = () => {
  if (window.innerWidth < 400) {
    document.getElementsByClassName("playInfo")[0].style.display = "none"
    return 100;
  }
  else {
       document.getElementsByClassName("playInfo")[0].style.display = "block";

    return 120;
  }
}

var kMusic = new Audio("./audio/Monkeys-Spinning-Monkeys.mp3");
// function for playing background music
let playNow = setTimeout(function () {
  kMusic.play();
  kMusic.muted = false;
}, 1000);
// function for music stoping after 60secs
let stopNow = setTimeout(function () {
  kMusic.muted = true;
}, 60000);

console.log(kMusic.play())

var count = 0;
//volume mute/unmute option function
let pauseIt = document
  .getElementById("volumeMuter")
  .addEventListener("click", () =>
    setTimeout(() => {
      count % 2 == 0 ? kMusic.pause() : kMusic.play();
      console.log("count value " + count);
      count++;

      count % 2 == 0
        ? (document.getElementById("volumeChanger").classList =
            "fas fa-volume-up")
        : (document.getElementById("volumeChanger").classList =
            "fas fa-volume-mute");
    }, 0)
  );

let hit = new Audio("./audio/punch.wav","muted");

const boxes = document.querySelectorAll(".box");
const time = document.querySelector("#time span");
const mole = document.createElement("img");

let score = 0;
let timeCount = 60;
let interval;
let timeInterval;

boxes.forEach((box) => {
  box.addEventListener("click", (el) => {
    if (el.target.type === "mole") {
      hit.play();
      
      score += 1;
      mole.style.display = "none";
      document.getElementById("scores").innerText = score;
      cursor =
        url('./assets/images/hammer.png');
      

    }
  });
});

interval = setInterval(() => {
  mole.type = "mole";
  mole.src = "./assets/images/mole.png";
  mole.height = 120;
  mole.width = gameWidth();
  mole.style.display = "block";
  const box = Math.floor(Math.random() * boxes.length);
  boxes[box].appendChild(mole);
  setTimeout(() => (mole.style.display = "none"), 1200);
}, 1500);

timeInterval = setInterval(() => {
  timeCount -= 1;
  time.innerText = timeCount;

  if (timeCount === 0) {
    document.getElementById("gameboard").style.display = "none";
    document.getElementById("gameover").style.display = "flex";
    document.getElementById("scoreDisplay").innerText = score;
    var bMusic = new Audio("./audio/smb_gameover.wav");
    bMusic.play();
    clearInterval(interval);
    clearInterval(timeInterval);
  }
}, 1000);
