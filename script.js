// =========================
// CLICKBET88 ARENA LOMBA
// =========================

const loginBtn = document.getElementById("loginBtn");
const memberID = document.getElementById("memberID");

loginBtn.addEventListener("click", function () {

    if (memberID.value.trim() === "") {

        alert("Silakan masukkan ID Member!");

        memberID.focus();

        return;

    }

    loginBtn.innerHTML = "MEMASUKI ARENA...";

    loginBtn.disabled = true;

    setTimeout(function () {

        window.location.href = "game.html";

    }, 1200);

});
