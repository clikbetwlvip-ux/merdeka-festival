// ============================
// CLICKBET88 PANJAT PINANG
// Version 1.0
// ============================

const loginBtn = document.getElementById("loginBtn");
const memberID = document.getElementById("memberID");

loginBtn.addEventListener("click", startGame);

function startGame(){

    if(memberID.value.trim()==""){
        alert("Masukkan ID Member terlebih dahulu!");
        return;
    }

    document.body.innerHTML=`

    <div class="game">

        <h1>PANJAT PINANG</h1>

        <div class="pole">

            <div id="box">🎁</div>

            <div id="player">🧍</div>

        </div>

        <div class="progress">

            <div id="bar"></div>

        </div>

        <button id="climbBtn">

            PANJAT

        </button>

    </div>

    `;

    game();

}

function game(){

let progress=0;

const player=document.getElementById("player");
const bar=document.getElementById("bar");
const btn=document.getElementById("climbBtn");

btn.onclick=function(){

let naik=Math.random()*8+5;

progress+=naik;

if(Math.random()<0.15){

progress-=12;

if(progress<0){

progress=0;

}

alert("Ups! Terpeleset 😆");

}

if(progress>100){

progress=100;

}

bar.style.width=progress+"%";

player.style.bottom=(progress*4)+"px";

if(progress>=100){

menang();

}

}

}

function menang(){

setTimeout(()=>{

document.body.innerHTML=`

<div class="winner">

<h1>🎉 SELAMAT 🎉</h1>

<h2>ANDA BERHASIL</h2>

<button id="gift">

BUKA MYSTERY BOX

</button>

</div>

`;

document.getElementById("gift").onclick=hadiah;

},500);

}

function hadiah(){

let hadiah=[

"FREEBET Rp10.000",

"FREEBET Rp25.000",

"FREEBET Rp50.000",

"BONUS DEPOSIT 20%",

"BONUS DEPOSIT 30%",

"LUCKY SPIN"

];

let random=Math.floor(Math.random()*hadiah.length);

alert("Selamat!\n\n"+hadiah[random]);

location.reload();

}
