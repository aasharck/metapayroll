import Navbar from './components/Navbar';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import Account from './Account';
import Home from './Home';


function App() {

  window.ethereum.on('networkChanged', () => {
    document.location.reload()
  })
  

  return (
    <div className='container'>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/account' element={<Account />}></Route>
      </Routes>
    </div>
  );
}

export default App;
