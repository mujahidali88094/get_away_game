import React, { useState } from "react";
import { getCookie, setCookie } from "../utilities/utility";

const CardsContext = React.createContext({
	name: '',
	mySocket: {},
	changeName: ()=>{}
});
export default CardsContext;

export const CardsContextProvider = ({ socket,children }) => {

	let [ name, setName ] = useState(() => {
		let name = getCookie('name');
		return (name === '') ? 'Type Your Name Here' : name;
	})

	let [mySocket, setMySocket] = useState(socket);

	let [gameId, setGameId] = useState(null);
	let [maxNoOfPlayers, setMaxNoOfPlayers] = useState(0);
	let [members, setMembers] = useState([]);
	let [myIndex, setMyIndex] = useState(0);
	let [cards, setCards] = useState([]);

	let changeName = (newName) => {
		setName(newName);
		setCookie('name', newName, 365);
	}

	return(
		<CardsContext.Provider value={{
			name,
			changeName,
			mySocket,
			gameId,
			setGameId,
			maxNoOfPlayers,
			setMaxNoOfPlayers,
			cards,
			setCards,
			myIndex,
			setMyIndex,
			members,
			setMembers
		}}>
			{children}
		</CardsContext.Provider>
	)
}