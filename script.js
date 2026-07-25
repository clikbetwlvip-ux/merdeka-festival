const loginScreen = document.getElementById("loginScreen");
const loadingScreen = document.getElementById("loadingScreen");
const gameScreen = document.getElementById("gameScreen");
const rewardScreen = document.getElementById("rewardScreen");

const loginBtn = document.getElementById("loginBtn");
const memberID = document.getElementById("memberID");

const loadingFill = document.getElementById("loadingFill");
const progressFill = document.getElementById("progressFill");

const player = document.getElementById("player");
const climbBtn = document.getElementById("climbBtn");

const rewardText = document.getElementById("rewardText");

let progress = 0;

const hadiah = [
"FREEBET Rp10.000",
"FREEBET Rp25.000",
"FREEBET Rp50.000",
"BONUS DEPOSIT 20%",
"BONUS DEPOSIT 30%",
"LUCKY SPIN"
];

loginBtn.onclick = () => {

if(memberID.value.trim()==""){
alert("Masukkan ID Member");
return;
}

loginScreen.classList.add("hidden");
loadingScreen.classList.remove("hidden");

let load = 0;

let timer = setInterval(()=>{

load+=2;

loadingFill.style.width=load+"%";

if(load>=100){

clearInterval(timer);

loadingScreen.classList.add("hidden");

gameScreen.classList.remove("hidden");

}

},30);

};

climbBtn.onclick=()=>{

let naik=Math.random()*8+5;

progress+=naik;

if(Math.random()<0.2){

progress-=10;

if(progress<0)progress=0;

alert("Ups! Terpeleset 😆");

}

if(progress>100){

progress=100;

}

progressFill.style.width=progress+"%";

player.style.bottom=(20+progress*4)+"px";

if(progress>=100){

menang();

}

};

function menang(){

gameScreen.classList.add("hidden");

rewardScreen.classList.remove("hidden");

let random=Math.floor(Math.random()*hadiah.length);

rewardText.innerHTML=hadiah[random];

}
