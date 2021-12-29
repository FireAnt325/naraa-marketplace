import React, { useState, useEffect } from 'react';
// import { Line } from '@ant-design/charts';
import {
  Row,
  Col,
  Image,
  Button,
  Tooltip,
  Checkbox,
  Space,
  Input,
} from 'antd';
import { TagsTwoTone } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
// import {
//   LineChart,
//   Line,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   PieChart,
//   Pie,
//   RadialBarChart,
//   RadialBar,
//   Legend,
// } from 'recharts';


const {TextArea} = Input;

export const EachCollectionNFTView = () => {
//   const [history, setHistory] = useState([]);
const perItemData1 = useLocation();
const perItemData = perItemData1.state as any;
console.log(perItemData);
const data = [
  { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
];

  return (
    <>
      <div className="rectangle2 nft-colls">
        <Row gutter={16} style={{padding: '100px 0'}}>
          <Col span={11} className="gutter-row">
            <div className="nft-img">
                <img src="./Rectangle 914.png" width="100%" />
                <div className='fav-counts font-12'><i className="fas fa-heart font-22"></i>06 favorites</div>
            </div>
            <div className='description'>
                <div className='head'>
                    <span style={{fontSize: '22px'}}><i className="fas fa-list font-22" style={{marginRight: '20px'}}></i>Description</span>
                    <span><i className="fas fa-arrow-circle-down font-22 color-blue"></i></span>
                </div>
                <p style={{margin: '20px 30px'}}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ultrices pellentesque urna vitae pretium orci condimentum luctus. Sodales faucibus porttitor facilisis quis feugiat dolor. Dignissim amet, enim purus cras viverra semper ut egestas morbi. At sapien scelerisque risus mi id velit, elit sit neque. Ultrices volutpat tempus, dignissim bibendum quam imperdiet massa interdum in. 
                </p>
            </div>
          </Col>
          <Col span={1}></Col>
          <Col span={12} className="gutter-row details">
            <p className='font-16'>List Price</p>
            <p className='font-24 listPrice'>8.24Ξ ($25,089)</p>
            <p className='font-14'>Current offer:  0.52Ξ</p>
            <p className='badged'>CURSUS ENIM.<i className="fas fa-heart font-22"></i></p>
            <p className='font-24 font-bold' style={{margin: '30px 0px'}}>CURSUS ENIM #7705</p>
            <div className='favs'>
                <div>
                    <span>Owned by</span>
                    <span className='color-blue' style={{marginLeft: '10px'}}> you</span>
                </div>
                <div>
                    <i className="fas fa-eye font-22"></i>
                    <span>17 Views</span>
                </div>
                <div>
                    <i className="fas fa-heart font-22"></i>
                    <span>06 favorites</span>
                </div>
            </div>
            <Button className='buy-link'><Link to={{ pathname: `/listforsale`, state: perItemData }} >SELL</Link></Button>
            <div className='chart-area'>
                <div className='chart-head'>
                    <span className='font-22'><i className="fas fa-chart-line font-22" style={{marginRight: '30px'}}></i>Price History</span>
                    <span><i className="fas fa-arrow-circle-up font-22 color-blue"></i></span>
                </div>
                <div className='chart-body'>
                {/* <LineChart
                  width={600}
                  height={300}
                  data={data}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <Line type="monotone" dataKey="uv" stroke="#8884d8" />
                  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                  <XAxis dataKey="name" />
                  <YAxis />
                </LineChart> */}
                </div>
            </div>
            <div className='chart-footer'>
                <span className='font-22'><i className="fas fa-heart font-22" style={{marginRight: '30px'}}></i>Listings</span>
                <span><i className="fas fa-arrow-circle-down font-22"></i></span>
            </div>
          </Col>
        </Row>
      </div>
      <div className='nft-colls'>
        <Row gutter={64} style={{paddingTop: '100px', paddingBottom: '30px'}}>
          <Col span={12} className="gutter-row">
            <h2 style={{marginBottom: '50px'}}>History</h2>
            <div>
              <Space align="center">
                <Image src="./avatar.svg" preview={false} style={{width: '36.6px'}} />
                <span className="mock-block" style={{color: 'black'}}>walecyberpunk</span>
              </Space>
              <div>
                <Input defaultValue="Won auction with a bid of 0.782Ξ ($1,586)" style={{backgroundColor:"white", border:"solid 1px black", borderRadius:"3px", color:"black"}} />
              </div>
              <p style={{color: '#C4C4C4', marginLeft: '30px'}}>2 MONTHS AGO</p>
            </div>
            <div>
              <Space align="center">
                <Image src="./avatar.svg" preview={false} style={{width: '36.6px'}} />
                <span className="mock-block" style={{color: 'black'}}>walecyberpunk</span>
              </Space>
              <div>
                <Input defaultValue="Won auction with a bid of 0.782Ξ ($1,586)" style={{backgroundColor:"white", border:"solid 1px black", borderRadius:"3px", color:"black"}} />
              </div>
              <p style={{color: '#C4C4C4', marginLeft: '30px'}}>2 MONTHS AGO</p>
            </div>
            <div>
              <Space align="center">
                <Image src="./avatar.svg" preview={false} style={{width: '36.6px'}} />
                <span className="mock-block" style={{color: 'black'}}>walecyberpunk</span>
              </Space>
              <div>
                <Input defaultValue="Won auction with a bid of 0.782Ξ ($1,586)" style={{backgroundColor:"white", border:"solid 1px black", borderRadius:"3px", color:"black"}} />
              </div>
              <p style={{color: '#C4C4C4', marginLeft: '30px'}}>2 MONTHS AGO</p>
            </div>
          </Col>
          <Col span={12} className="gutter-row">
            <h2 style={{marginBottom: '50px'}}>Comments 15</h2>
            <Row gutter={16}>
              <Col span={3} className="gutter-row">
                <Image src="./avatar.svg" preview={false} />
              </Col>
              <Col span={21} className="gutter-row add-comment">
                <TextArea defaultValue="Add a new comment" className="subscribe" style={{backgroundColor: '#F3F3F3'}} />
                <Button className="start_collecting">Post</Button>
              </Col>
            </Row>
            <Row gutter={16} style={{marginTop: '20px'}}>
              <Col span={3} className="gutter-row">
                <Image src="./avatar.svg" preview={false} />
              </Col>
              <Col span={21} className="gutter-row">
                <div style={{backgroundColor: '#F3F3F3', padding: '20px', borderRadius: '5px'}}>
                  <p><b>username</b></p>
                  <p style={{marginBottom: 0}}>It's cool</p>
                </div>
                <Space align="center">
                  <div style={{marginTop: '5px'}}><Image src="./market/message.svg" preview={false} /></div>
                  <span className="mock-block" style={{color: 'black'}}>reply</span>
                  <div style={{marginTop: '5px', marginLeft: '10px'}}><i className="fas fa-heart"></i></div>
                </Space>
              </Col>
            </Row>
            <Row gutter={16} style={{marginTop: '20px'}}>
              <Col offset={3} span={3} className="gutter-row">
                <Image src="./avatar.svg" preview={false} />
              </Col>
              <Col span={18} className="gutter-row">
                <div style={{backgroundColor: '#F3F3F3', padding: '20px', borderRadius: '5px'}}>
                  <p><b>username</b></p>
                  <p style={{marginBottom: 0}}>It's cool</p>
                </div>
                <Space align="center">
                  <div style={{marginTop: '5px'}}><Image src="./market/message.svg" preview={false} /></div>
                  <span className="mock-block" style={{color: 'black'}}>reply</span>
                  <div style={{marginTop: '5px', marginLeft: '10px'}}><i className="fas fa-heart"></i></div>
                </Space>
              </Col>
            </Row>
            <Row gutter={16} style={{marginTop: '20px'}}>
              <Col span={3} className="gutter-row">
                <Image src="./avatar.svg" preview={false} />
              </Col>
              <Col span={21} className="gutter-row">
                <div style={{backgroundColor: '#F3F3F3', padding: '20px', borderRadius: '5px'}}>
                  <p><b>username</b></p>
                  <p style={{marginBottom: 0}}>It's cool</p>
                </div>
                <Space align="center">
                  <div style={{marginTop: '5px'}}><Image src="./market/message.svg" preview={false} /></div>
                  <span className="mock-block" style={{color: 'black'}}>reply</span>
                  <div style={{marginTop: '5px', marginLeft: '10px'}}><i className="fas fa-heart"></i></div>
                </Space>
              </Col>
            </Row>
            <Row gutter={16} style={{marginTop: '20px'}}>
              <Col offset={3} span={3} className="gutter-row">
                <Image src="./avatar.svg" preview={false} />
              </Col>
              <Col span={18} className="gutter-row">
                <div style={{backgroundColor: '#F3F3F3', padding: '20px', borderRadius: '5px'}}>
                  <p><b>username</b></p>
                  <p style={{marginBottom: 0}}>It's cool</p>
                </div>
                <Space align="center">
                  <div style={{marginTop: '5px'}}><Image src="./market/message.svg" preview={false} /></div>
                  <span className="mock-block" style={{color: 'black'}}>reply</span>
                  <div style={{marginTop: '5px', marginLeft: '10px'}}><i className="fas fa-heart"></i></div>
                </Space>
              </Col>
            </Row>
            <Row gutter={16} style={{marginTop: '20px'}}>
              <Col span={3} className="gutter-row">
                <Image src="./avatar.svg" preview={false} />
              </Col>
              <Col span={21} className="gutter-row">
                <div style={{backgroundColor: '#F3F3F3', padding: '20px', borderRadius: '5px'}}>
                  <p><b>username</b></p>
                  <p style={{marginBottom: 0}}>It's cool</p>
                </div>
                <Space align="center">
                  <div style={{marginTop: '5px'}}><Image src="./market/message.svg" preview={false} /></div>
                  <span className="mock-block" style={{color: 'black'}}>reply</span>
                  <div style={{marginTop: '5px', marginLeft: '10px'}}><i className="fas fa-heart"></i></div>
                </Space>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </>
  )
}