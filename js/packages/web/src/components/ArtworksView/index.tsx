import React, { useEffect, useState } from 'react';
import {
  Layout,
  Row,
  Col,
  Image,
  Button,
  Input,
  Space,
} from 'antd';
import {LinkOutlined} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useUserArts } from '../../hooks';
const { Content } = Layout;
const {TextArea} = Input;
const images = [
    {items: ['./market/Rectangle.svg', './market/Rectangle3.svg', './market/Rectangle6.svg']},
    {items: ['./market/Rectangle1.svg', './market/Rectangle4.svg', './market/Rectangle7.svg']},
    {items: ['./market/Rectangle2.svg', './market/Rectangle5.svg', './market/Rectangle8.svg']}
];

async function fetchNftData (tempItem) {
    try {
        let uri = tempItem.metadata.info.data.uri;
        const result = await fetch(uri)
        return await result.json()
    } catch (err) {
        return null
    }
}

export const ArtworksView = () => {
    let items = useUserArts();
    // console.log("items here", items[0]);
    const [nftData, setNftData] = useState([] as any);
    useEffect(() => {
        items.map((item) => {
            fetchNftData(item).then(data => {
                data && setNftData(tempItem => [...new Set([...tempItem, data])])
              }).then(() => {
                return nftData;
              });
        });
    }, []);
    console.log("nftData = ", nftData)
    return (
        <Content>
        <Row>
        {
            nftData.map((item, key) =>
            {
                return (
                    <Col span={8} className="gutter-row">
                        <Link to={{ pathname: `/collections/` + 1 + `/` + key, state: {'selectedItem': item , 'itemInfo': items[key]} }}  key={key}>
                            <div style={{padding:"10px"}} onClick={()=>{
                            }}> 
                                <Image src={item.image} preview={false} className="rectangle6"/>
                                <div style={{textAlign: 'left'}}>

                                    <Row>
                                    <Col span={12}>
                                        <h3 style={{
                                        fontFamily: "Poppins",
                                        fontStyle: "normal",
                                        fontWeight: "bold",
                                        fontSize: "21px",
                                        lineHeight: "31px",
                                        display: "flex",
                                        alignItems: "center",
                                        color: "#000000"
                                    }}>{item.name}</h3>
                                    </Col>
                                    <Col span={12}>
                                        <div style={{float:"right"}}>
                                        <Image src="./Vector.svg" preview={false} style={{width: '20px'}} />
                                        <span className="mock-block" style={{color: '#C4C4C4'}}>41</span>
                                        </div>
                                    </Col>
                                    </Row>
                                    {/* <Row>
                                    <Col span={24}>
                                        <p style={{
                                        fontFamily:"Poppins",
                                        fontStyle:"normal",
                                        fontWeight:"bold",
                                        fontSize:"14px",
                                        lineHeight:"21px",
                                        color: "#0057FF"
                                        }}>{item.symbol}</p>
                                        <p style={{
                                        fontFamily: "Poppins",
                                        fontStyle: "normal",
                                        fontWeight: "normal",
                                        fontSize: "12px",
                                        lineHeight: "18px",
                                        color: "#0057FF"
                                        }}>15Ξ ($9,160)</p>
                                    </Col>
                                    </Row> */}
                                </div>
                            </div>
                        </Link>
                    </Col>
                )
            })
        }
            {/* // images.map((image, index) =>
            <Col span={8} className="gutter-row" key={index}>
            {
                image.items.map((item, key) =>
                <Link to={`/arts`} key={key} >
                    <div style={{padding:"10px"}} onClick={()=>{
                    }}>
                    <Image src="https://www.arweave.net/6srDxylJsmQnyAR7zrR0fvLDexVUOwZo_Vkxajzz2Fw" preview={false} className="rectangle6" />
                    <div style={{textAlign: 'left'}}>

                        <Row>
                        <Col span={12}>
                            <h3 style={{
                            fontFamily: "Poppins",
                            fontStyle: "normal",
                            fontWeight: "bold",
                            fontSize: "21px",
                            lineHeight: "31px",
                            display: "flex",
                            alignItems: "center",
                            color: "#000000"
                        }}>Metaverse Blast</h3>
                        </Col>
                        <Col span={12}>
                            <div style={{float:"right"}}>
                            <Image src="./Vector.svg" preview={false} style={{width: '20px'}} />
                            <span className="mock-block" style={{color: '#C4C4C4'}}>41</span>
                            </div>
                        </Col>
                        </Row>
                        <Row>
                        <Col span={24}>
                            <p style={{
                            fontFamily:"Poppins",
                            fontStyle:"normal",
                            fontWeight:"bold",
                            fontSize:"14px",
                            lineHeight:"21px",
                            color: "#0057FF"
                            }}>8.24Ξ ($25,089)</p>
                            <p style={{
                            fontFamily: "Poppins",
                            fontStyle: "normal",
                            fontWeight: "normal",
                            fontSize: "12px",
                            lineHeight: "18px",
                            color: "#0057FF"
                            }}>15Ξ ($9,160)</p>
                        </Col>
                        </Row>
                    </div>
                    </div>
                </Link>
                )
            }
            </Col>
            )
        } */}
        </Row>
    </Content>
  )}