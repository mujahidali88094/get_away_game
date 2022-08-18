export const SUITS = {
  HEART: '♥',
  DIAMOND: '♦',
  CLUB: '♣',
  SPADE: '♠'
}
export const numbersValues = new Map();
numbersValues.set('A', 14);
numbersValues.set('K', 13);
numbersValues.set('Q', 12);
numbersValues.set('J', 11);
numbersValues.set('10', 10);
numbersValues.set('9', 9);
numbersValues.set('8', 8);
numbersValues.set('7', 7);
numbersValues.set('6', 6);
numbersValues.set('5', 5);
numbersValues.set('4', 4);
numbersValues.set('3', 3);
numbersValues.set('2', 2);

function compare(a, b) { //custom compare func for cards sort
	let suits = ['♥', '♣', '♦', '♠'];
	if (a.suit === b.suit) {
		if (numbersValues.get(a.number) < numbersValues.get(b.number)) return -1;
		else return 1;
	}
	else if (suits.indexOf(a.suit) < suits.indexOf(b.suit)) return -1;
	else return 1;
}
export function getArrangedCards(cards) {
	cards.sort(compare);
	return cards;
}


export function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export function checkCookie() {
  let user = getCookie("username");
  if (user !== "") {
    alert("Welcome again " + user);
  } else {
    user = prompt("Please enter your name:", "");
    if (user !== "" && user !== null) {
      setCookie("username", user, 365);
    }
  }
}

