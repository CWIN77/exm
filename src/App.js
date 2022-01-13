import './App.scss';
import React, { useState, useEffect } from 'react';
import firebase from './index'
import { Link, Route, Switch } from 'react-router-dom';

import { ReactComponent as Img_logo } from './img/logo.svg';
import { ReactComponent as Img_addBtn } from './img/addBtn.svg';
import { ReactComponent as Img_list } from './img/list.svg';
import { ReactComponent as Img_date } from './img/date.svg';
import { ReactComponent as Img_stat } from './img/stat.svg';
import { ReactComponent as Img_logout } from './img/logout.svg';
import { ReactComponent as Img_back } from './img/back.svg';
import { ReactComponent as Img_clock } from './img/clock.svg';


function App() {
  const db = firebase.firestore();
  const [user,setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const [month,setMonth] = useState(String(first.getMonth()+1));
  const [year,setYear] = useState(first.getFullYear());
  const [ratio, setRatio] = useState(null);

  const [expend,setExpend] = useState(JSON.parse(localStorage.getItem('expend')) || []);
  const [total,setTotal] = useState(JSON.parse(localStorage.getItem('total')) || 0);
  const [isAdd,setIsAdd] = useState(false);
  const [overFunc,setOverFunc] = useState(false);
  const [isLoading,setIsLoading] = useState(false); 
  const [isGetDataUse,setIsGetDataUse] = useState(Boolean(JSON.parse(localStorage.getItem('expend'))));


  function login() {
    if(!user){
      setIsLoading(true);
      var provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth()
      .signInWithPopup(provider)
      .then((result) => {
        localStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user)
        alert('로그인완료');
        setIsLoading(false);
      }).catch((error) => {
        var errorMessage = error.message; 
        alert(errorMessage);
      });
    }else{
      alert('이미 로그인했습니다');
    }
  }

  function logout() {
    if(user){
      if(window.confirm('로그아웃 하겠습니까?')){
        setIsLoading(true);
        firebase.auth().signOut().then(() => {
          localStorage.removeItem('user');
          setUser(null);
          alert('로그아웃완료');
          setIsLoading(false);
        }).catch((error) => {
          var errorMessage = error.message;
          alert(errorMessage);
        });
      }
    }else{
      alert('로그인되어 있지 않습니다');
    }
  }

  function getMoneyText(cost) {
    return cost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function getData() {
    if(!isGetDataUse){
      console.log('getData');
      setIsGetDataUse(true);
      const first = new Date(year, month, 1);
      const firstYear = String(year-2000);
      const firstDay = first.getDate() < 10 ? 0+String(first.getDate()) : String(first.getDate()) ;
      const firstMonth = month < 10 ? 0+String(month) : String(month);
      const firstDate = firstYear + firstMonth + firstDay;

      const last = new Date(year, month+1, 0);
      const lastYear = String(year-2000);
      const lastDay = last.getDate() < 10 ? 0+String(last.getDate()) : String(last.getDate()) ;
      const lastMonth = month < 10 ? 0+String(month) : String(month);
      const lastDate = lastYear + lastMonth + lastDay;
      
      db.collection('exm').doc(user.uid).collection('_l').where('!t','>=',Number(firstDate)).where('!t','<=',Number(lastDate)).get()
      .then((docs)=>{
        setExpend([]);
        setTotal(0);
        let listObject = {};
        let date = {};
        docs.forEach((doc)=>{
          for(const [key,value] of Object.entries(doc.data())){
            if(key != '!t'){
              if(listObject.hasOwnProperty(key)){
                listObject[key] += value;
                date[key].push(doc.id);
              }else{
                listObject[key] = value;
                date[key] = [doc.id];
              }
            }
          }
        })
        var temp2 = 0;
        var tempList = [];
        for(const [key,value] of Object.entries(listObject)){
          tempList.push({name:key,cost:value,date:date[key]});
          temp2 += value;
        }
        for (let i = 0; i < tempList.length; i++) {
          for (let j = i; j < tempList.length; j++) {
            if(tempList[j].cost > tempList[i].cost){
              var temp = tempList[i]
              tempList[i] = tempList[j];
              tempList[j] = temp;
            }
          }
        }
        setExpend(tempList);
        setTotal(temp2);

        localStorage.setItem('expend', JSON.stringify(tempList));
        localStorage.setItem('total', JSON.stringify(temp2));
      })
    }
  }

  function addData() {
    const name = document.querySelector('.input #name').value;
    const cost = document.querySelector('.input #cost').value;
    const date_input = document.querySelector('.input #date').value;
    const year = date_input.split('-')[0] - 2000;
    const month = date_input.split('-')[1];
    const day = date_input.split('-')[2];
    const date = year + month + day;

    if(name == '!t'){
      name = 't'
    }
    if(name && cost){
      db.collection('exm').doc(user.uid).collection('_l').doc(date).set({
        '!t':Number(date),
        [name] : firebase.firestore.FieldValue.increment(Number(cost))
      },{merge:true}).then(()=>{
        alert('저장 성공!');
        document.querySelector('.input #name').value = '';
        document.querySelector('.input #cost').value = '';
        setIsGetDataUse(false);
        getData();
      })
    }else{
      alert('입력란이 공백입니다.');
    }
  }

  function deleteData(name,date) {
    if(window.confirm(`${name} 삭제할까요?`)){
      date.forEach((doc)=>{
        db.collection('exm').doc(user.uid).collection('_l').doc(doc).update({
          [name]: firebase.firestore.FieldValue.delete()
        })
      })
      alert('삭제 성공!');
      setIsGetDataUse(false);
      getData();
    } 
  }

  function tGetData() {

  }

  const Emx = () => {
    useEffect(()=>{
      if(!isGetDataUse){
        getData();
      }
    })

    return (
      <>
        <div className='total'>
          <div className='title'>총 지출 금액</div>
          <div className='cost' onClick={()=>{tGetData()}}>{getMoneyText(total)}원</div>
          <div className='month'>{month}월</div>
        </div>
        <div className='list'>
          <div className='title'>리스트</div>
          <span className='line'/>
          {
            expend.map((doc,i)=>{
              if(i === 0){setRatio(total/doc.cost)}
              return(
                <div key={i} className='comp'>
                  <div onClick={()=>{deleteData(doc.name,doc.date)}} className='title'><div className='func' />{doc.name}</div>
                  <span style={{width:270 *doc.cost/total*ratio}} className='perc' />
                  <div className='cost'>{getMoneyText(doc.cost)}원</div>
                </div>
              )
            })
          }
        </div>
        <Img_addBtn onClick={()=>{setIsAdd(!isAdd)}} className='addBtn' />
        {
          isAdd
          ? <AddModal />
          : null
        }
      </>
    )
  }
  
  const List = () => {
    return (
      <div>
        리스트
      </div>
    )
  }

  const OverFunc = () => {
    return (
      <div className='func' onClick={()=>{setOverFunc(!overFunc)}}>
        <div className='comp'>
          <img style={{borderRadius:'20px',width:26,height:26,marginRight:6}} className='img' src={user.photoURL} />
          <div className='text'>{user.displayName}</div>
        </div>
        <Link to="/list" className='comp'>
          <Img_list className='img' />
          <span className='text'>기록</span>
        </Link>
        <div className='comp'>
          <Img_date className='img' />
          <span className='text'>{month}월</span>
        </div>
        <Link to="/state" className='comp'>
          <Img_stat className='img' />
          <span className='text'>통계</span>
        </Link>
        <div className='comp' onClick={()=>{logout();setOverFunc(!overFunc);}}>
          <Img_logout className='img' />
          <span className='text'>로그아웃</span>
        </div>
      </div>
    )
  }

  const Loading = () => {
    return (
      <div className='loding'>
        <Img_clock width="36px" height='36px' fill="white" style={{marginBottom:'12'}} />
        <div style={{fontSize:'16px',marginBottom:4}}>처리중...</div>
      </div>
    )
  }

  const Login = () => {
    return (
      <div className='login'>
        <div className='title'>Login</div>
        <div onClick={()=>{login()}} className='google'>Google</div>
        <div className='subtitle'>로그인 후 이용 가능합니다.</div>
      </div>
    )
  }

  const AddModal = () => {
    const today = new Date()
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const [name,setName] = useState('')
    const [cost,setCost] = useState('')
    const [date,setDate] = useState(year + '-' + month + '-' + day)
    
    return (
      <div className="addModalContainer">
        <div onClick={()=>{setIsAdd(!isAdd)}} className='background' />
        <div className='addModal'>
          <div className='head'>
            <div className='title'>지출비용 추가</div>
            <Img_back className='back' onClick={()=>{setIsAdd(!isAdd)}} />
          </div>
          <div className='input'>
            <input className='input_comp' onChange={(e)=>{setName(e.target.value)}} value={name} type="text" id='name' placeholder='이름' />
            <input className='input_comp' onChange={(e)=>{setCost(e.target.value)}} value={cost} type="number" id='cost' placeholder='비용' />
            <input className='input_comp' style={{color:'black'}} onChange={(e)=>{setDate(e.target.value)}} value={date} type="date" id='date' className='date' />
          </div>
          <div className='save'><span onClick={()=>{addData()}}>추가</span></div>
        </div>
      </div>
    )
  }

  const Top = () => {
    return (
      <nav className='top'>
        <Img_logo onClick={()=>{window.location.href=window.location.origin}} />
        {
          user
          ? <span onClick={()=>{setOverFunc(!overFunc)}} className='overFunc'/>
          : null
        }
        {
          overFunc
          ? <OverFunc />
          : null
        }
      </nav>
    )
  }

  const Center = () => {
    return (
      <div className='center'>
        {
          user
          ? <Switch>
              <Route path="/list">
                <List />
              </Route>
              <Route path="/">
                <Emx />
              </Route>
            </Switch>
          : <Login />
        }
      </div>
    )
  }

  return (
    <div className="App">
      {
        isLoading
        ? <Loading />
        : null
      }
      <Top />
      <Center />
    </div>
  );
}

export default App;
