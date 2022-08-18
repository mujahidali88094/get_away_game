import React from 'react';
import { themes } from '../utilities/utility';

const themeContext = React.createContext({
	theme: themes.light,
	toggleTheme : ()=>{}
});

export default themeContext;