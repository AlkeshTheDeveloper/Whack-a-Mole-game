 (function () {
    
     let kMusic = new Audio("./audio/Monkeys-Spinning-Monkeys.mp3");
     
})();

let hit = new Audio("./audio/punch.wav");

document.getElementById("volume").addEventListener("click", () => {});

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
    }
  });
});

   
    interval = setInterval(() => {
        mole.type = "mole";
        mole.src = "./mole.png";
        mole.height = 100;
        mole.width = 100;
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
                document.getElementById("gameover").style.display = "block";
                  document.getElementById("scoreDisplay").innerText = score;

            var bMusic = new Audio("./audio/smb_gameover.wav");
            bMusic.play();
            clearInterval(interval);
            clearInterval(timeInterval);
        
        }
    }, 1000);
    


// document.getElementById("start").addEventListener("click", () => {
//     window.onload = playAudio
//   score == 0 ? window.location.reload() : "";
// });
