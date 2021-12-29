import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Divider,
  Steps,
  Row,
  Button,
  Col,
  Input,
  Statistic,
  Progress,
  Spin,
  Radio,
  Card,
  Select,
  Checkbox,
  Layout,
  Image,
  Space,
  Dropdown,
  Menu,
  Collapse,
  Switch
} from 'antd';
import { useUserArts } from '../../hooks';
// import { Layout, Image, Space, Dropdown, Menu, Collapse, Switch } from 'antd';
import { ArtCard } from './../../components/ArtCard';
import { MINIMUM_SAFE_FEE_AUCTION_CREATION, QUOTE_MINT } from './../../constants';
import { Confetti } from './../../components/Confetti';
import { ArtSelector } from './artSelector';
import {
  MAX_METADATA_LEN,
  useConnection,
  WinnerLimit,
  WinnerLimitType,
  toLamports,
  useMint,
  Creator,
  PriceFloor,
  PriceFloorType,
  IPartialCreateAuctionArgs,
  MetadataKey,
  StringPublicKey,
  WRAPPED_SOL_MINT,
  shortenAddress,
  useNativeAccount,
} from '@oyster/common';
import { InfoCircleOutlined, LeftOutlined, DownOutlined, UserOutlined, ConsoleSqlOutlined } from '@ant-design/icons';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { MintInfo, MintLayout } from '@solana/spl-token';
import { useHistory, useParams } from 'react-router-dom';
import { capitalize } from 'lodash';
import {
  WinningConfigType,
  AmountRange,
} from '@oyster/common/dist/lib/models/metaplex/index';
import moment from 'moment';
import {
  createAuctionManager,
  SafetyDepositDraft,
} from '../../actions/createAuctionManager';
import BN from 'bn.js';
import { constants } from '@oyster/common';
import { DateTimePicker } from '../../components/DateTimePicker';
import { AmountLabel } from '../../components/AmountLabel';
import { useMeta } from '../../contexts';
import useWindowDimensions from '../../utils/layout';
import { PlusCircleOutlined } from '@ant-design/icons';
import { SystemProgram } from '@solana/web3.js';
import TokenDialog, { TokenButton } from '../../components/TokenDialog';
import { useTokenList } from '../../contexts/tokenList';
import { mintTo } from '@project-serum/serum/lib/token-instructions';
import { TokenInfo } from '@solana/spl-token-registry'
import { FundsIssueModal } from "../../components/FundsIssueModal";
import { useLocation } from 'react-router-dom';
import { prototype } from 'events';
const { Option } = Select;
const { Step } = Steps;
const { ZERO } = constants;

export enum AuctionCategory {
  InstantSale,
  Limited,
  Single,
  Open,
  Tiered,
}

enum InstantSaleType {
  Limited,
  Single,
  Open,
}

interface TierDummyEntry {
  safetyDepositBoxIndex: number;
  amount: number;
  winningConfigType: WinningConfigType;
}

interface Tier {
  items: (TierDummyEntry | {})[];
  winningSpots: number[];
}
interface TieredAuctionState {
  items: SafetyDepositDraft[];
  tiers: Tier[];
  participationNFT?: SafetyDepositDraft;
}

export interface AuctionState {
  // Min price required for the item to sell
  reservationPrice: number;

  // listed NFTs
  items: SafetyDepositDraft[];
  participationNFT?: SafetyDepositDraft;
  participationFixedPrice?: number;
  // number of editions for this auction (only applicable to limited edition)
  editions?: number;

  // date time when auction should start UTC+0
  startDate?: Date;

  // suggested date time when auction should end UTC+0
  endDate?: Date;

  //////////////////
  category: AuctionCategory;

  price?: number;
  priceFloor?: number;
  priceTick?: number;

  startSaleTS?: number;
  startListTS?: number;
  endTS?: number;

  auctionDuration?: number;
  auctionDurationType?: 'days' | 'hours' | 'minutes';
  gapTime?: number;
  gapTimeType?: 'days' | 'hours' | 'minutes';
  tickSizeEndingPhase?: number;

  spots?: number;
  tiers?: Array<Tier>;

  winnersCount: number;

  instantSalePrice?: number;
  instantSaleType?: InstantSaleType;

  quoteMintAddress: string;
  quoteMintInfo: MintInfo;
  quoteMintInfoExtended: TokenInfo;
}
export const SaleCreateView = () => {
  const item = useLocation();
  const[startSellFlag, setStartSellFlag] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [endReviewFlag, setEndReviewFlag] = useState(false);
  const [perItemData, setPerItemData] = useState({} as any);
  // let tempData = JSON.stringify(item.state);
  // let perItemData = JSON.parse(tempData);
  const perItemData1 = item.state as any;
  
  const connection = useConnection();
  const wallet = useWallet();
  const { whitelistedCreatorsByCreator, storeIndexer } = useMeta();
  const { step_param }: { step_param: string } = useParams();
  const history = useHistory();
  const mint = useMint(QUOTE_MINT);
  const { width } = useWindowDimensions();

  const [step, setStep] = useState<number>(0);
  const [stepsVisible, setStepsVisible] = useState<boolean>(true);
  const [auctionObj, setAuctionObj] =
    useState<
      | {
          vault: StringPublicKey;
          auction: StringPublicKey;
          auctionManager: StringPublicKey;
        }
      | undefined
    >(undefined);
  const [attributes, setAttributes] = useState<AuctionState>({
    reservationPrice: 0,
    items: [],
    category: AuctionCategory.InstantSale,
    auctionDurationType: 'minutes',
    gapTimeType: 'minutes',
    winnersCount: 1,
    startSaleTS: undefined,
    startListTS: undefined,
    quoteMintAddress: '',
    //@ts-ignore
    quoteMintInfo: undefined,
    //@ts-ignore
    quoteMintInfoExtended: undefined,
  });

  const [tieredAttributes, setTieredAttributes] = useState<TieredAuctionState>({
    items: [],
    tiers: [],
  });
  const [quoteMintAddress, setQuoteMintAddress] = useState<string>()
  const [quoteMintInfo, setQuoteMintInfo] = useState<MintInfo>()
  const [quoteMintInfoExtended, setQuoteMintInfoExtended] = useState<TokenInfo>()

 
  // useEffect(() => {
  //   if (step_param) setStep(parseInt(step_param));
  //   else gotoNextStep(3);
  // }, [step_param]);

  const gotoNextStep = (_step?: number) => {
    const nextStep = _step === undefined ? step + 1 : _step;
    // history.push(`/listforsale/${nextStep.toString()}`);
    history.push(`/listforsale/`);
  };

  const createAuction = async () => {
    console.log("1 = createAuction")
    let winnerLimit: WinnerLimit;
    console.log("2 = ", attributes)
    //const mint = attributes.quoteMintInfo
    if (
      attributes.category === AuctionCategory.InstantSale &&
      attributes.instantSaleType === InstantSaleType.Open
      ) {
      const { items, instantSalePrice } = attributes;

      if (items.length > 0 && items[0].participationConfig) {
        items[0].participationConfig.fixedPrice = new BN(
          toLamports(instantSalePrice, mint) || 0,
        );
      }

      winnerLimit = new WinnerLimit({
        type: WinnerLimitType.Unlimited,
        usize: ZERO,
      });
      console.log("3 = ", winnerLimit)
    } else if (attributes.category === AuctionCategory.InstantSale) {
      const { items, editions } = attributes;
      console.log("4 = ", items)
      console.log("5 = ", editions)

      if (items.length > 0) {
        const item = items[0];
        console.log("6 = ", item)
        if (!editions) {
          item.winningConfigType =
            item.metadata.info.updateAuthority ===
            (wallet?.publicKey || SystemProgram.programId).toBase58()
              ? WinningConfigType.FullRightsTransfer
              : WinningConfigType.TokenOnlyTransfer;
        }

        item.amountRanges = [
          new AmountRange({
            amount: new BN(1),
            length: new BN(editions || 1),
          }),
        ];
      }

      winnerLimit = new WinnerLimit({
        type: WinnerLimitType.Capped,
        usize: new BN(editions || 1),
      });
    } else if (attributes.category === AuctionCategory.Open) {
      console.log("7 = ", attributes)
      if (
        attributes.items.length > 0 &&
        attributes.items[0].participationConfig
      ) {
        attributes.items[0].participationConfig.fixedPrice = new BN(
          toLamports(attributes.participationFixedPrice, mint) || 0,
        );
      }
      winnerLimit = new WinnerLimit({
        type: WinnerLimitType.Unlimited,
        usize: ZERO,
      });
    } else if (
      attributes.category === AuctionCategory.Limited ||
      attributes.category === AuctionCategory.Single
    ) {
      console.log("8 = ", attributes)
      if (attributes.items.length > 0) {
        const item = attributes.items[0];
        if (
          attributes.category == AuctionCategory.Single &&
          item.masterEdition
        ) {
          item.winningConfigType =
            item.metadata.info.updateAuthority ===
            (wallet?.publicKey || SystemProgram.programId).toBase58()
              ? WinningConfigType.FullRightsTransfer
              : WinningConfigType.TokenOnlyTransfer;
        }
        item.amountRanges = [
          new AmountRange({
            amount: new BN(1),
            length:
              attributes.category === AuctionCategory.Single
                ? new BN(1)
                : new BN(attributes.editions || 1),
          }),
        ];
      }
      winnerLimit = new WinnerLimit({
        type: WinnerLimitType.Capped,
        usize:
          attributes.category === AuctionCategory.Single
            ? new BN(1)
            : new BN(attributes.editions || 1),
      });

      if (
        attributes.participationNFT &&
        attributes.participationNFT.participationConfig
      ) {
        console.log("9 = ", attributes)
        attributes.participationNFT.participationConfig.fixedPrice = new BN(
          toLamports(attributes.participationFixedPrice, mint) || 0,
        );
      }
    } else {
      console.log("10 = ", attributes)
      const tiers = tieredAttributes.tiers;
      tiers.forEach(
        c =>
          (c.items = c.items.filter(
            i => (i as TierDummyEntry).winningConfigType !== undefined,
          )),
      );
      let filteredTiers = tiers.filter(
        i => i.items.length > 0 && i.winningSpots.length > 0,
      );

      tieredAttributes.items.forEach((config, index) => {
        let ranges: AmountRange[] = [];
        filteredTiers.forEach(tier => {
          const tierRangeLookup: Record<number, AmountRange> = {};
          const tierRanges: AmountRange[] = [];
          const item = tier.items.find(
            i => (i as TierDummyEntry).safetyDepositBoxIndex == index,
          );

          if (item) {
            console.log("11 = ", item)
            config.winningConfigType = (
              item as TierDummyEntry
            ).winningConfigType;
            const sorted = tier.winningSpots.sort();
            sorted.forEach((spot, i) => {
              if (tierRangeLookup[spot - 1]) {
                console.log("12 = ", item)
                tierRangeLookup[spot] = tierRangeLookup[spot - 1];
                tierRangeLookup[spot].length = tierRangeLookup[spot].length.add(
                  new BN(1),
                );
              } else {
                console.log("13 = ", item)
                tierRangeLookup[spot] = new AmountRange({
                  amount: new BN((item as TierDummyEntry).amount),
                  length: new BN(1),
                });
                // If the first spot with anything is winner spot 1, you want a section of 0 covering winning
                // spot 0.
                // If we have a gap, we want a gap area covered with zeroes.
                const zeroLength = i - 1 > 0 ? spot - sorted[i - 1] - 1 : spot;
                if (zeroLength > 0) {
                  tierRanges.push(
                    new AmountRange({
                      amount: new BN(0),
                      length: new BN(zeroLength),
                    }),
                  );
                }
                tierRanges.push(tierRangeLookup[spot]);
              }
            });
            // Ok now we have combined ranges from this tier range. Now we merge them into the ranges
            // at the top level.
            let oldRanges = ranges;
            ranges = [];
            let oldRangeCtr = 0,
              tierRangeCtr = 0;

            while (
              oldRangeCtr < oldRanges.length ||
              tierRangeCtr < tierRanges.length
            ) {
              let toAdd = new BN(0);
              if (
                tierRangeCtr < tierRanges.length &&
                tierRanges[tierRangeCtr].amount.gt(new BN(0))
              ) {
                toAdd = tierRanges[tierRangeCtr].amount;
              }

              if (oldRangeCtr == oldRanges.length) {
                ranges.push(
                  new AmountRange({
                    amount: toAdd,
                    length: tierRanges[tierRangeCtr].length,
                  }),
                );
                tierRangeCtr++;
              } else if (tierRangeCtr == tierRanges.length) {
                ranges.push(oldRanges[oldRangeCtr]);
                oldRangeCtr++;
              } else if (
                oldRanges[oldRangeCtr].length.gt(
                  tierRanges[tierRangeCtr].length,
                )
              ) {
                oldRanges[oldRangeCtr].length = oldRanges[
                  oldRangeCtr
                ].length.sub(tierRanges[tierRangeCtr].length);

                ranges.push(
                  new AmountRange({
                    amount: oldRanges[oldRangeCtr].amount.add(toAdd),
                    length: tierRanges[tierRangeCtr].length,
                  }),
                );

                tierRangeCtr += 1;
                // dont increment oldRangeCtr since i still have length to give
              } else if (
                tierRanges[tierRangeCtr].length.gt(
                  oldRanges[oldRangeCtr].length,
                )
              ) {
                tierRanges[tierRangeCtr].length = tierRanges[
                  tierRangeCtr
                ].length.sub(oldRanges[oldRangeCtr].length);

                ranges.push(
                  new AmountRange({
                    amount: oldRanges[oldRangeCtr].amount.add(toAdd),
                    length: oldRanges[oldRangeCtr].length,
                  }),
                );

                oldRangeCtr += 1;
                // dont increment tierRangeCtr since they still have length to give
              } else if (
                tierRanges[tierRangeCtr].length.eq(
                  oldRanges[oldRangeCtr].length,
                )
              ) {
                console.log("15 = ")
                ranges.push(
                  new AmountRange({
                    amount: oldRanges[oldRangeCtr].amount.add(toAdd),
                    length: oldRanges[oldRangeCtr].length,
                  }),
                );
                // Move them both in this degen case
                oldRangeCtr++;
                tierRangeCtr++;
              }
            }
          }
        });
        console.log('Ranges');
        config.amountRanges = ranges;
      });

      winnerLimit = new WinnerLimit({
        type: WinnerLimitType.Capped,
        usize: new BN(attributes.winnersCount),
      });
      if (
        attributes.participationNFT &&
        attributes.participationNFT.participationConfig
      ) {
        console.log("14 = ", attributes)
        attributes.participationNFT.participationConfig.fixedPrice = new BN(
          toLamports(attributes.participationFixedPrice, mint) || 0,
        );
      }
      console.log('Tiered settings', tieredAttributes.items);
    }

    const isInstantSale =
      attributes.instantSalePrice &&
      attributes.priceFloor === attributes.instantSalePrice;

    const LAMPORTS_PER_TOKEN = attributes.quoteMintAddress == WRAPPED_SOL_MINT.toBase58()? LAMPORTS_PER_SOL
      : Math.pow(10, attributes.quoteMintInfo.decimals || 0)

    const auctionSettings: IPartialCreateAuctionArgs = {
      winners: winnerLimit,
      endAuctionAt: isInstantSale
        ? null
        : new BN(
            (attributes.auctionDuration || 0) *
              (attributes.auctionDurationType == 'days'
                ? 60 * 60 * 24 // 1 day in seconds
                : attributes.auctionDurationType == 'hours'
                ? 60 * 60 // 1 hour in seconds
                : 60), // 1 minute in seconds
          ), // endAuctionAt is actually auction duration, poorly named, in seconds
      auctionGap: isInstantSale
        ? null
        : new BN(
            (attributes.gapTime || 0) *
              (attributes.gapTimeType == 'days'
                ? 60 * 60 * 24 // 1 day in seconds
                : attributes.gapTimeType == 'hours'
                ? 60 * 60 // 1 hour in seconds
                : 60), // 1 minute in seconds
          ),
      priceFloor: new PriceFloor({
        type: attributes.priceFloor
          ? PriceFloorType.Minimum
          : PriceFloorType.None,
        minPrice: new BN((attributes.priceFloor || 0) * LAMPORTS_PER_TOKEN),
      }),
      tokenMint: attributes.quoteMintAddress,
      gapTickSizePercentage: attributes.tickSizeEndingPhase || null,
      tickSize: attributes.priceTick
        ? new BN(attributes.priceTick * LAMPORTS_PER_TOKEN)
        : null,
      instantSalePrice: attributes.instantSalePrice
        ? new BN((attributes.instantSalePrice || 0) * LAMPORTS_PER_TOKEN)
        : null,
      name: null,
    };

    const isOpenEdition =
      attributes.category === AuctionCategory.Open ||
      attributes.instantSaleType === InstantSaleType.Open;
    const safetyDepositDrafts = isOpenEdition
      ? []
      : attributes.category !== AuctionCategory.Tiered
      ? attributes.items
      : tieredAttributes.items;
    const participationSafetyDepositDraft = isOpenEdition
      ? attributes.items[0]
      : attributes.participationNFT;

    const _auctionObj = await createAuctionManager(
      connection,
      wallet,
      whitelistedCreatorsByCreator,
      auctionSettings,
      safetyDepositDrafts,
      participationSafetyDepositDraft,
      attributes.quoteMintAddress,
      storeIndexer,
    );
    setAuctionObj(_auctionObj);
  };

  const categoryStep = (
    <CategoryStep
      confirm={(category: AuctionCategory) => {
        setAttributes({
          ...attributes,
          category,
        });
        gotoNextStep();
      }}
    />
  );

  const instantSaleStep = (
    <InstantSaleStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const copiesStep = (
    <CopiesStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const winnersStep = (
    <NumberOfWinnersStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const priceAuction = (
    <PriceAuction
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const initialStep = (
    <InitialPhaseStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const endingStep = (
    <EndingPhaseAuction
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const participationStep = (
    <ParticipationStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const tierTableStep = (
    <TierTableStep
      attributes={tieredAttributes}
      setAttributes={setTieredAttributes}
      maxWinners={attributes.winnersCount}
      confirm={() => gotoNextStep()}
    />
  );

  const reviewStep = (
    <ReviewStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => {
        setStepsVisible(false);
        gotoNextStep();
      }}
      connection={connection}
    />
  );

  const waitStep = (
    <WaitingStep createAuction={createAuction} confirm={() => gotoNextStep()} />
  );

  const { Panel } = Collapse;

  const [showId, setShow] = useState(0);

  const congratsStep = <Congrats auction={auctionObj} />;

  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<UserOutlined />}>
        1st menu item
      </Menu.Item>
      <Menu.Item key="2" icon={<UserOutlined />}>
        1st menu item
      </Menu.Item>
      <Menu.Item key="3" icon={<UserOutlined />}>
        1st menu item
      </Menu.Item>
    </Menu>
  )
  
  const [collapseFlag, setCollapseFlag] = useState(false);

  const [showFundsIssueModal, setShowFundsIssueModal] = useState(false)

  const handleConfirm = () => {
    setAttributes({
      ...attributes,
      startListTS: attributes.startListTS || moment().unix(),
      startSaleTS: attributes.startSaleTS || moment().unix(),
    });
    // confirm();
    
    // alert("really wanna sell it?")
    setStartSellFlag(true);

  }

  const { account } = useNativeAccount();

  const balance = (account?.lamports || 0) / LAMPORTS_PER_SOL;

  const handleCollapse = () => {
    console.log('here');
    if(collapseFlag){
      setCollapseFlag(false);
    } else {
      setCollapseFlag(true);
    }
  }

  const stepsByCategory = {
    [AuctionCategory.InstantSale]: [
      ['Category', categoryStep],
      ['Instant Sale', instantSaleStep],
      ['Review', reviewStep],
      ['Publish', waitStep],
      [undefined, congratsStep],
    ],
    [AuctionCategory.Limited]: [
      ['Category', categoryStep],
      ['Copies', copiesStep],
      ['Price', priceAuction],
      ['Initial Phase', initialStep],
      ['Ending Phase', endingStep],
      ['Participation NFT', participationStep],
      ['Review', reviewStep],
      ['Publish', waitStep],
      [undefined, congratsStep],
    ],
    [AuctionCategory.Single]: [
      ['Category', categoryStep],
      ['Copies', copiesStep],
      ['Price', priceAuction],
      ['Initial Phase', initialStep],
      ['Ending Phase', endingStep],
      ['Participation NFT', participationStep],
      ['Review', reviewStep],
      ['Publish', waitStep],
      [undefined, congratsStep],
    ],
    [AuctionCategory.Open]: [
      ['Category', categoryStep],
      ['Copies', copiesStep],
      ['Price', priceAuction],
      ['Initial Phase', initialStep],
      ['Ending Phase', endingStep],
      ['Review', reviewStep],
      ['Publish', waitStep],
      [undefined, congratsStep],
    ],
    [AuctionCategory.Tiered]: [
      ['Category', categoryStep],
      ['Winners', winnersStep],
      ['Tiers', tierTableStep],
      ['Price', priceAuction],
      ['Initial Phase', initialStep],
      ['Ending Phase', endingStep],
      ['Participation NFT', participationStep],
      ['Review', reviewStep],
      ['Publish', waitStep],
      [undefined, congratsStep],
    ],
  };
  const [mint1, setMint] = useState<PublicKey>(WRAPPED_SOL_MINT)
  // give default value to mint

  const { hasOtherTokens, tokenMap} = useTokenList()

  // give default value to mint
  const mintInfo = tokenMap.get((!mint1? QUOTE_MINT.toString(): mint1.toString()))

  attributes.quoteMintAddress = mint1? mint1.toBase58(): QUOTE_MINT.toBase58()

  if (attributes.quoteMintAddress) {
    attributes.quoteMintInfo = useMint(attributes.quoteMintAddress)!
    attributes.quoteMintInfoExtended = useTokenList().tokenMap.get(attributes.quoteMintAddress)!
  }
  // let inte;
  useEffect(() => {
    setPerItemData(perItemData1);
    setAttributes({
      ...attributes,
      items: [perItemData1.itemInfo],
    });
    
  }, []);
  useEffect(() => {
    const func = async () => {
      const inte = setInterval(
        () => setProgress(prog => Math.min(prog + 1, 99)),
        600,
      );
      await createAuction();
      clearInterval(inte);
      // setEndReviewFlag(true);
    };
    if(startSellFlag) {
        func();
    }
  }, [startSellFlag]);
  useEffect(() => {
    if(progress == 99){
      // alert(1);
      setStartSellFlag(false);
      setProgress(0);
      history.push(`/`)
    }
  }, [progress]);
  
  return (
    <>
      <Layout>
      <div>
          <div className='lfs owner-bar'>
              <Space align="center" style={{height: "100px"}}>
                  <LeftOutlined className='lfs owner-icon'/>
                  <Image src={perItemData.selectedItem?.image} preview={false}  className='lfs owner-img' />
                  <div style={{paddingLeft: '15px'}}>
                      <h3>{perItemData.selectedItem?.name}</h3>
                      <span>{perItemData.selectedItem?.description}</span>
                  </div>
              </Space>
          </div>

        <div className="lfs main">
          <Row>
              <Col sm={24} lg={12} className='lfs input-area'>
                  <p className='lfs list-top-title'>LIST ITEM FOR SALE</p>
                  <Row>
                    <Col span={12} className='lfs subtitle subtitle-space'>
                      <span>Type</span>
                    </Col>
                    <Col span={12} className='lfs subtitle-space'>
                      <InfoCircleOutlined  className='lfs icon-info' />
                    </Col>
                    <Col span={12} className='btn-sub2 sub2-l'>
                      <Button className={showId>0? "btn-default unselected":"btn-default"}
                        onClick={() => { setShow(0); }}
                      >
                        <span style={{marginRight: '10px'}}>&#36;</span>Fixed Price
                      </Button>
                    </Col>
                    <Col span={12} className='btn-sub2 sub2-r'>
                      <Button className={showId>0? "btn-default":"btn-default unselected"}
                          onClick={() => { setShow(1); }}
                        >
                          <span><img src='/Group 1753.png' className='lfs time-icon'/>Timed Auction</span>
                      </Button>
                    </Col>
                  </Row>

                  <Row style={showId>0? {display: 'none'}:{display: 'flex'}}>
                    <Col span={12} className='lfs subtitle subtitle-space'>
                      <span>Price</span>
                    </Col>
                    <Col span={12}>
                      <InfoCircleOutlined  className='lfs icon-info subtitle-space' />
                    </Col>
                    <Col xs={8} sm={8} md={8} lg={5}>
                      <Dropdown overlay={menu}>
                        <Button className='btn-default' style={{width: '100%'}}>
                          <Space align='center' style={{float: 'left'}}><i className="fab fa-ethereum lfs price-icon"></i>SOL</Space>
                          {/* <Space align='center' style={{float: 'right'}}><DownOutlined /></Space> */}
                        </Button>
                      </Dropdown>
                    </Col>
                    <Col xs={16} sm={16} md={16} lg={19} style={{paddingLeft: '10px'}}>
                      <Input placeholder='Amount'
                        onChange={info =>
                          setAttributes({
                            ...attributes,
                            priceFloor: parseFloat(info.target.value),
                            instantSalePrice: parseFloat(info.target.value),
                          })
                        }></Input>
                      
                    </Col>
                    <Col span={24} className='lfs subtitle-space'>
                      <Space direction="vertical" style={{width: '100%'}}>
                        <Collapse collapsible="header" defaultActiveKey={['0']} bordered={false} expandIconPosition="right" onChange={handleCollapse}>
                          <Panel header="More Options" key="1" className='lfs-collapse' style={collapseFlag?{display:"none"}:{display:"block"}} />
                          <div style={collapseFlag?{display:"block", transition:"all 0.5s linear"}:{display:"none", transition:"all 0.5s linear"}}>
                          <Row>
                            <Col span={24}>
                              <p className='lfs subtitle subtitle-space'>Schedule Listing</p>
                              <i className='far fa-calendar-alt lfs icon-input'></i>
                              <Input placeholder='6 months'></Input>
                            </Col>
                            <Col span={12} className='lfs subtitle subtitle-space'>Sell as a bundle</Col>
                            <Col span={12}><Switch className='lfs icon-info subtitle-space' /></Col>
                            <Col span={12} className='lfs subtitle'>Reverse for specific buyer</Col>
                            <Col span={12}><Switch className='lfs icon-info' /></Col>
                          </Row>
                          </div>
                          <Panel header="Fewer Options" key="2" className='lfs-collapse fewer-title lfs subtitle-space' style={collapseFlag?{display:"block"}:{display:"none"}}/>
                        </Collapse>
                      </Space>
                    </Col>
                    <Col span={24}>
                      <Input className='border-bottom'></Input>
                    </Col>
                  </Row>

                  <Row style={showId>0? {display: 'flex'}:{display: 'none'}}>
                    <Col span={24}>
                      <p className='lfs subtitle subtitle-space'>Method</p>
                      <i className="fas fa-arrow-up lfs icon-input" style={{transform: 'rotate(45deg)'}}></i>
                      <Input placeholder='Sell to highest bidder'></Input>
                    </Col>
                    <Col span={24} className='lfs subtitle subtitle-space'>
                      <span>Starting Price</span>
                    </Col>
                    <Col xs={8} sm={8} md={8} lg={5}>
                      <Dropdown overlay={menu}>
                        <Button className='btn-default' style={{width: '100%'}}>
                          <Space align='center' style={{float: 'left'}}><i className="fab fa-ethereum"></i>WETH</Space>
                          <Space align='center' style={{float: 'right'}}><DownOutlined /></Space>
                        </Button>
                      </Dropdown>
                    </Col>
                    <Col xs={16} sm={16} md={16} lg={19} style={{paddingLeft: '10px'}}>
                      <Input placeholder='Amount'></Input>
                    </Col>
                    <Col span={24}>
                      <p className='lfs subtitle subtitle-space'>Duration</p>
                      <i className='far fa-calendar-alt lfs icon-input'></i>
                      <Input placeholder='7 days'></Input>
                    </Col>

                    <Col span={24} className='lfs subtitle-space'>
                      <Space direction="vertical" style={{width: '100%'}}>
                        <Collapse collapsible="header" defaultActiveKey={['0']} bordered={false} expandIconPosition="right" onChange={handleCollapse}>
                          <Panel header="More Options" key="1" className='lfs-collapse' style={collapseFlag?{display:"none"}:{display:"block"}} />
                          <div style={collapseFlag?{display:"block", transition:"all 0.5s linear"}:{display:"none", transition:"all 0.5s linear"}}>
                          <Row>
                            <Col span={12} className='lfs subtitle'>Include reverse price</Col>
                            <Col span={12}><Switch className='lfs icon-info' /></Col>
                          </Row>
                          </div>
                          <Panel header="Fewer Options" key="2" className='lfs-collapse fewer-title lfs subtitle-space' style={collapseFlag?{display:"block"}:{display:"none"}}/>
                        </Collapse>
                      </Space>
                    </Col>
                  </Row>

                  <Row>
                    <Col span={12} className='lfs subtitle lfs subtitle-space'>
                      <span>Fees</span>
                    </Col>
                    <Col span={12}>
                      <InfoCircleOutlined  className='lfs icon-info lfs subtitle-space' />
                    </Col>
                    <Col span={12} className='lfs fees text-left'>
                      <span>Service Fee</span>
                    </Col>
                    <Col span={12} className='lfs fees text-right'>
                      <span>2.5%</span>
                    </Col>
                    <Col span={12} className='lfs fees text-left'>
                      <span>Creator Royalty</span>
                    </Col>
                    <Col span={12} className='lfs fees text-right'>
                      <span>3.9%</span>
                    </Col>
                    <Col xs={12} sm={8} md={6} lg={6} className='lfs subtitle-space'>
                      <Button
                        type="primary"
                        size="large"
                        disabled = {startSellFlag}
                        onClick={() => {
                          if (balance < MINIMUM_SAFE_FEE_AUCTION_CREATION) {
                            setShowFundsIssueModal(true)
                          } else {
                            handleConfirm()
                          }
                        }}
                        className="action-btn"
                      >
                        
                        {attributes.category === AuctionCategory.InstantSale
                          ? 'List for Sale'
                          : 'Publish Auction'}
                      </Button>
                      { startSellFlag && (
                          <Progress percent={progress} />
                        )}
                      <FundsIssueModal
                        minimumFunds={0.06}
                        currentFunds={balance}
                        isModalVisible={showFundsIssueModal}
                        onClose={() => setShowFundsIssueModal(false)}
                      />
                    </Col>
                  </Row>
              </Col>
              <Col sm={24} lg={12} className='lfs item-attr'>
                  <div>
                      <Image src={perItemData.selectedItem?.image} />
                      <Row style={{marginTop: '20px'}}>
                          <Col span={16}><span className="lfs item-collect">{perItemData.selectedItem?.name}</span></Col>
                          <Col span={16}><span className="lfs item-name">{perItemData.selectedItem?.description}</span></Col>
                      </Row>
                  </div>
              </Col>
          </Row>
        </div>
      </div>
      </Layout>
    </>
  );
};

const CategoryStep = (props: {
  confirm: (category: AuctionCategory) => void;
}) => {
  const { width } = useWindowDimensions();
  return (
    <>
      <Row className="call-to-action">
        <h2 style={{color: '#000', marginLeft: '0px'}}>List an item</h2>
        <p>
          First time listing on Metaplex? <a>Read our sellers' guide.</a>
        </p>
      </Row>
      <Row justify={width < 768 ? 'center' : 'start'}>
        <Col>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(AuctionCategory.InstantSale)}
            >
              <div>
                <div>Instant Sale</div>
                <div className="type-btn-description">
                  At a fixed price, sell a single Master NFT or copies of it
                </div>
              </div>
            </Button>
          </Row>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(AuctionCategory.Limited)}
            >
              <div>
                <div>Limited Edition</div>
                <div className="type-btn-description">
                  Sell a limited copy or copies of a single Master NFT
                </div>
              </div>
            </Button>
          </Row>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(AuctionCategory.Open)}
            >
              <div>
                <div>Open Edition</div>
                <div className="type-btn-description">
                  Sell unlimited copies of a single Master NFT
                </div>
              </div>
            </Button>
          </Row>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(AuctionCategory.Tiered)}
            >
              <div>
                <div>Tiered Auction</div>
                <div className="type-btn-description">
                  Participants get unique rewards based on their leaderboard
                  rank
                </div>
              </div>
            </Button>
          </Row>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(AuctionCategory.Single)}
            >
              <div>
                <div>Sell an Existing Item</div>
                <div className="type-btn-description">
                  Sell an existing item in your NFT collection, including Master
                  NFTs
                </div>
              </div>
            </Button>
          </Row>
        </Col>
      </Row>
    </>
  );
};

const InstantSaleStep = ({
  attributes,
  setAttributes,
  confirm,
}: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [mint, setMint] = useState<PublicKey>(WRAPPED_SOL_MINT)
  // give default value to mint

  const { hasOtherTokens, tokenMap} = useTokenList()

  // give default value to mint
  const mintInfo = tokenMap.get((!mint? QUOTE_MINT.toString(): mint.toString()))

  attributes.quoteMintAddress = mint? mint.toBase58(): QUOTE_MINT.toBase58()

  if (attributes.quoteMintAddress) {
    attributes.quoteMintInfo = useMint(attributes.quoteMintAddress)!
    attributes.quoteMintInfoExtended = useTokenList().tokenMap.get(attributes.quoteMintAddress)!
  }

  //console.log("OBJ MINT", mint.toBase58())

  const copiesEnabled = useMemo(
    () => !!attributes?.items?.[0]?.masterEdition?.info?.maxSupply,
    [attributes?.items?.[0]],
  );
  const artistFilter = useCallback(
    (i: SafetyDepositDraft) =>
      !(i.metadata.info.data.creators || []).some((c: Creator) => !c.verified),
    [],
  );

  const isLimitedEdition =
    attributes.instantSaleType === InstantSaleType.Limited;
  const shouldRenderSelect = attributes.items.length > 0;

  return (
    <>
      <Row className="call-to-action" style={{ marginBottom: 0 }}>
        <h2 style={{color: '#000', marginLeft: '0px'}}>Select which item to sell:</h2>
      </Row>

      <Row className="content-action">
        <Col xl={24}>
          <ArtSelector
            filter={artistFilter}
            selected={attributes.items}
            setSelected={items => {
              setAttributes({ ...attributes, items });
            }}
            allowMultiple={false}
          >
            Select NFT
          </ArtSelector>

          {shouldRenderSelect && (
            <label className="action-field">
              <Select
                defaultValue={
                  attributes.instantSaleType || InstantSaleType.Single
                }
                onChange={value =>
                  setAttributes({
                    ...attributes,
                    instantSaleType: value,
                  })
                }
              >
                <Option value={InstantSaleType.Single}>
                  Sell unique token
                </Option>
                {copiesEnabled && (
                  <Option value={InstantSaleType.Limited}>
                    Sell limited number of copies
                  </Option>
                )}
                {!copiesEnabled && (
                  <Option value={InstantSaleType.Open}>
                    Sell unlimited number of copies
                  </Option>
                )}
              </Select>
              {isLimitedEdition && (
                <>
                  <span className="field-info">
                    Each copy will be given unique edition number e.g. 1 of 30
                  </span>
                  <Input
                    autoFocus
                    className="input"
                    placeholder="Enter number of copies sold"
                    allowClear
                    onChange={info =>
                      setAttributes({
                        ...attributes,
                        editions: parseInt(info.target.value),
                      })
                    }
                  />
                </>
              )}
            </label>
          )}
          {hasOtherTokens && (
            <label className="action-field">
              <span className="field-title">Auction mint</span>
              <TokenButton mint={mint} onClick={() => setShowTokenDialog(true)} />
              <TokenDialog
                setMint={setMint}
                open={showTokenDialog}
                onClose={() => {
                  setShowTokenDialog(false);
                }}
              />
            </label>
          )}
          <label className="action-field">
            <span className="field-title" style={{color: '#000'}}>Price</span>
            <span className="field-info" style={{color: '#000'}}>
              This is the instant sale price for your item.
            </span>
            <Input
              type="number"
              min={0}
              autoFocus
              className="input"
              placeholder="Price"
              prefix="◎"
              suffix={mintInfo?.symbol || "CUSTOM"}
              onChange={info =>
                setAttributes({
                  ...attributes,
                  priceFloor: parseFloat(info.target.value),
                  instantSalePrice: parseFloat(info.target.value),
                })
              }
            />
          </label>
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={() => {
            confirm();
          }}
          className="action-btn"
        >
          Continue
        </Button>
      </Row>
    </>
  );
};

const CopiesStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [mint, setMint] = useState<PublicKey>(WRAPPED_SOL_MINT)
  const { hasOtherTokens, tokenMap } = useTokenList()

  // give default value to mint
  const mintInfo = tokenMap.get((!mint? QUOTE_MINT.toString(): mint.toString()))

  props.attributes.quoteMintAddress = mint? mint.toBase58(): QUOTE_MINT.toBase58()

  if (props.attributes.quoteMintAddress) {
    props.attributes.quoteMintInfo = useMint(props.attributes.quoteMintAddress)!
    props.attributes.quoteMintInfoExtended = useTokenList().tokenMap.get(props.attributes.quoteMintAddress)!
  }

  let artistFilter = (i: SafetyDepositDraft) =>
    !(i.metadata.info.data.creators || []).find((c: Creator) => !c.verified);
  let filter: (i: SafetyDepositDraft) => boolean = (i: SafetyDepositDraft) =>
    true;
  if (props.attributes.category === AuctionCategory.Limited) {
    filter = (i: SafetyDepositDraft) =>
      !!i.masterEdition && !!i.masterEdition.info.maxSupply;
  } else if (props.attributes.category === AuctionCategory.Open) {
    filter = (i: SafetyDepositDraft) =>
      !!(
        i.masterEdition &&
        (i.masterEdition.info.maxSupply === undefined ||
          i.masterEdition.info.maxSupply === null)
      );
  }

  let overallFilter = (i: SafetyDepositDraft) => filter(i) && artistFilter(i);

  return (
    <>
      <Row className="call-to-action" style={{ marginBottom: 0 }}>
        <h2 style={{color: '#000', marginLeft: '0px'}}>Select which item to sell</h2>
        <p style={{ fontSize: '1.2rem' }}>
          Select the item(s) that you want to list.
        </p>
      </Row>
      <Row className="content-action">
        <Col xl={24}>
          <ArtSelector
            filter={overallFilter}
            selected={props.attributes.items}
            setSelected={items => {
              props.setAttributes({ ...props.attributes, items });
            }}
            allowMultiple={false}
          >
            Select NFT
          </ArtSelector>
          {hasOtherTokens && (
            <label className="action-field">
              <span className="field-title">Auction mint</span>
              <TokenButton mint={mint} onClick={() => setShowTokenDialog(true)} />
              <TokenDialog
                setMint={setMint}
                open={showTokenDialog}
                onClose={() => {
                  setShowTokenDialog(false);
                }}
              />
            </label>
          )}
          {props.attributes.category === AuctionCategory.Limited && (
            <label className="action-field">
              <span className="field-title">
                How many copies do you want to create?
              </span>
              <span className="field-info">
                Each copy will be given unique edition number e.g. 1 of 30
              </span>
              <Input
                autoFocus
                className="input"
                placeholder="Enter number of copies sold"
                allowClear
                onChange={info =>
                  props.setAttributes({
                    ...props.attributes,
                    editions: parseInt(info.target.value),
                  })
                }
              />
            </label>
          )}
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={() => {
            props.confirm();
          }}
          className="action-btn"
        >
          Continue to Terms
        </Button>
      </Row>
    </>
  );
};

const NumberOfWinnersStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [mint, setMint] = useState<PublicKey>(WRAPPED_SOL_MINT)
  const { hasOtherTokens, tokenMap} = useTokenList()

  // give default value to mint
  const mintInfo = tokenMap.get((!mint? QUOTE_MINT.toString(): mint.toString()))

  props.attributes.quoteMintAddress = mint? mint.toBase58(): QUOTE_MINT.toBase58()

  if (props.attributes.quoteMintAddress) {
    props.attributes.quoteMintInfo = useMint(props.attributes.quoteMintAddress)!
    props.attributes.quoteMintInfoExtended = useTokenList().tokenMap.get(props.attributes.quoteMintAddress)!
  }

  return (
    <>
      <Row className="call-to-action">
        <h2 style={{color: '#000', marginLeft: '0px'}}>Tiered Auction</h2>
        <p>Create a Tiered Auction</p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <label className="action-field">
            <span className="field-title">
              How many participants can win the auction?
            </span>
            <span className="field-info">
              This is the number of spots in the leaderboard.
            </span>
            <Input
              type="number"
              autoFocus
              className="input"
              placeholder="Number of spots in the leaderboard"
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  winnersCount: parseInt(info.target.value),
                })
              }
            />
          </label>
          {hasOtherTokens && (
            <label className="action-field">
              <span className="field-title">Auction mint</span>
              <span className="field-info">
                This will be the quote mint for your auction.
              </span>
              <TokenButton mint={mint} onClick={() => setShowTokenDialog(true)} />
              <TokenDialog
                setMint={setMint}
                open={showTokenDialog}
                onClose={() => {
                  setShowTokenDialog(false);
                }}
              />
            </label>
          )}
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Continue
        </Button>
      </Row>
    </>
  );
};

const PriceAuction = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  console.log(props.attributes)
  const quoteMintName = props.attributes?.quoteMintInfoExtended?.name || "Custom Token"
  const quoteMintExt = props.attributes?.quoteMintInfoExtended?.symbol || shortenAddress(props.attributes.quoteMintAddress)
  return (
    <>
      <Row className="call-to-action">
        <h2 style={{color: '#000', marginLeft: '0px'}}>Price</h2>
        <p>
          Set the price for your auction.
          {props.attributes.quoteMintAddress != WRAPPED_SOL_MINT.toBase58() && ` Warning! the auction quote mint is `}
          {props.attributes.quoteMintAddress != WRAPPED_SOL_MINT.toBase58()&& <a href={`https://explorer.solana.com/address/${props.attributes?.quoteMintAddress}`} target="_blank"> {props.attributes?.quoteMintAddress != WRAPPED_SOL_MINT.toBase58() &&
            `${quoteMintName} (${quoteMintExt})`}
          </a>}
        </p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          {props.attributes.category === AuctionCategory.Open && (
            <label className="action-field">
              <span className="field-title">Price</span>
              <span className="field-info">
                This is the fixed price that everybody will pay for your
                Participation NFT.
              </span>
              <Input
                type="number"
                min={0}
                autoFocus
                className="input"
                placeholder="Fixed Price"
                prefix="◎"
                suffix={props.attributes.quoteMintInfoExtended? props.attributes.quoteMintInfoExtended.symbol
                    : props.attributes.quoteMintAddress == WRAPPED_SOL_MINT.toBase58()? "SOL": "CUSTOM"}
                onChange={info =>
                  props.setAttributes({
                    ...props.attributes,
                    // Do both, since we know this is the only item being sold.
                    participationFixedPrice: parseFloat(info.target.value),
                    priceFloor: parseFloat(info.target.value),
                  })
                }
              />
            </label>
          )}
          {props.attributes.category !== AuctionCategory.Open && (
            <label className="action-field">
              <span className="field-title">Price Floor</span>
              <span className="field-info">
                This is the starting bid price for your auction.
              </span>
              <Input
                type="number"
                min={0}
                autoFocus
                className="input"
                placeholder="Price"
                prefix="◎"
                suffix={props.attributes.quoteMintInfoExtended? props.attributes.quoteMintInfoExtended.symbol
                  : props.attributes.quoteMintAddress == WRAPPED_SOL_MINT.toBase58()? "SOL": "CUSTOM"}
                onChange={info =>
                  props.setAttributes({
                    ...props.attributes,
                    priceFloor: parseFloat(info.target.value),
                  })
                }
              />
            </label>
          )}
          <label className="action-field">
            <span className="field-title">Tick Size</span>
            <span className="field-info">
              All bids must fall within this price increment.
            </span>
            <Input
              type="number"
              min={0}
              className="input"
              placeholder={`Tick size in ${props.attributes.quoteMintInfoExtended? props.attributes.quoteMintInfoExtended.symbol
                : props.attributes.quoteMintAddress == WRAPPED_SOL_MINT.toBase58()? "SOL": "your custom currency"}`}
              prefix="◎"
              suffix={props.attributes.quoteMintInfoExtended? props.attributes.quoteMintInfoExtended.symbol
                : props.attributes.quoteMintAddress == WRAPPED_SOL_MINT.toBase58()? "SOL": "CUSTOM"}
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  priceTick: parseFloat(info.target.value),
                })
              }
            />
          </label>
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Continue
        </Button>
      </Row>
    </>
  );
};

const InitialPhaseStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  const [startNow, setStartNow] = useState<boolean>(true);
  const [listNow, setListNow] = useState<boolean>(true);

  const [saleMoment, setSaleMoment] = useState<moment.Moment | undefined>(
    props.attributes.startSaleTS
      ? moment.unix(props.attributes.startSaleTS)
      : undefined,
  );
  const [listMoment, setListMoment] = useState<moment.Moment | undefined>(
    props.attributes.startListTS
      ? moment.unix(props.attributes.startListTS)
      : undefined,
  );

  useEffect(() => {
    props.setAttributes({
      ...props.attributes,
      startSaleTS: saleMoment && saleMoment.unix(),
    });
  }, [saleMoment]);

  useEffect(() => {
    props.setAttributes({
      ...props.attributes,
      startListTS: listMoment && listMoment.unix(),
    });
  }, [listMoment]);

  useEffect(() => {
    if (startNow) {
      setSaleMoment(undefined);
      setListNow(true);
    } else {
      setSaleMoment(moment());
    }
  }, [startNow]);

  useEffect(() => {
    if (listNow) setListMoment(undefined);
    else setListMoment(moment());
  }, [listNow]);

  return (
    <>
      <Row className="call-to-action">
        <h2 style={{color: '#000', marginLeft: '0px'}}>Initial Phase</h2>
        <p>Set the terms for your auction.</p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <label className="action-field">
            <span className="field-title">
              When do you want the auction to begin?
            </span>
            <Radio.Group
              defaultValue="now"
              onChange={info => setStartNow(info.target.value === 'now')}
            >
              <Radio className="radio-field" value="now">
                Immediately
              </Radio>
              <div className="radio-subtitle">
                Participants can buy the NFT as soon as you finish setting up
                the auction.
              </div>
              <Radio className="radio-field" value="later">
                At a specified date
              </Radio>
              <div className="radio-subtitle">
                Participants can start buying the NFT at a specified date.
              </div>
            </Radio.Group>
          </label>

          {!startNow && (
            <>
              <label className="action-field">
                <span className="field-title">Auction Start Date</span>
                {saleMoment && (
                  <DateTimePicker
                    momentObj={saleMoment}
                    setMomentObj={setSaleMoment}
                    datePickerProps={{
                      disabledDate: (current: moment.Moment) =>
                        current && current < moment().endOf('day'),
                    }}
                  />
                )}
              </label>

              <label className="action-field">
                <span className="field-title">
                  When do you want the listing to go live?
                </span>
                <Radio.Group
                  defaultValue="now"
                  onChange={info => setListNow(info.target.value === 'now')}
                >
                  <Radio
                    className="radio-field"
                    value="now"
                    defaultChecked={true}
                  >
                    Immediately
                  </Radio>
                  <div className="radio-subtitle">
                    Participants will be able to view the listing with a
                    countdown to the start date as soon as you finish setting up
                    the sale.
                  </div>
                  <Radio className="radio-field" value="later">
                    At a specified date
                  </Radio>
                  <div className="radio-subtitle">
                    Participants will be able to view the listing with a
                    countdown to the start date at the specified date.
                  </div>
                </Radio.Group>
              </label>

              {!listNow && (
                <label className="action-field">
                  <span className="field-title">Preview Start Date</span>
                  {listMoment && (
                    <DateTimePicker
                      momentObj={listMoment}
                      setMomentObj={setListMoment}
                      datePickerProps={{
                        disabledDate: (current: moment.Moment) =>
                          current &&
                          saleMoment &&
                          (current < moment().endOf('day') ||
                            current > saleMoment),
                      }}
                    />
                  )}
                </label>
              )}
            </>
          )}
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Continue
        </Button>
      </Row>
    </>
  );
};

const EndingPhaseAuction = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  return (
    <>
      <Row className="call-to-action">
        <h2 style={{color: '#000', marginLeft: '0px'}}>Ending Phase</h2>
        <p>Set the terms for your auction.</p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <div className="action-field">
            <span className="field-title">Auction Duration</span>
            <span className="field-info">
              This is how long the auction will last for.
            </span>
            <Input
              addonAfter={
                <Select
                  defaultValue={props.attributes.auctionDurationType}
                  onChange={value =>
                    props.setAttributes({
                      ...props.attributes,
                      auctionDurationType: value,
                    })
                  }
                >
                  <Option value="minutes">Minutes</Option>
                  <Option value="hours">Hours</Option>
                  <Option value="days">Days</Option>
                </Select>
              }
              autoFocus
              type="number"
              className="input"
              placeholder="Set the auction duration"
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  auctionDuration: parseInt(info.target.value),
                })
              }
            />
          </div>

          <div className="action-field">
            <span className="field-title">Gap Time</span>
            <span className="field-info">
              The final phase of the auction will begin when there is this much
              time left on the countdown. Any bids placed during the final phase
              will extend the end time by this same duration.
            </span>
            <Input
              addonAfter={
                <Select
                  defaultValue={props.attributes.gapTimeType}
                  onChange={value =>
                    props.setAttributes({
                      ...props.attributes,
                      gapTimeType: value,
                    })
                  }
                >
                  <Option value="minutes">Minutes</Option>
                  <Option value="hours">Hours</Option>
                  <Option value="days">Days</Option>
                </Select>
              }
              type="number"
              className="input"
              placeholder="Set the gap time"
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  gapTime: parseInt(info.target.value),
                })
              }
            />
          </div>

          <label className="action-field">
            <span className="field-title">Tick Size for Ending Phase</span>
            <span className="field-info">
              In order for winners to move up in the auction, they must place a
              bid that’s at least this percentage higher than the next highest
              bid.
            </span>
            <Input
              type="number"
              className="input"
              placeholder="Percentage"
              suffix="%"
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  tickSizeEndingPhase: parseInt(info.target.value),
                })
              }
            />
          </label>
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Continue
        </Button>
      </Row>
    </>
  );
};

const TierTableStep = (props: {
  attributes: TieredAuctionState;
  setAttributes: (attr: TieredAuctionState) => void;
  maxWinners: number;
  confirm: () => void;
}) => {

  const newImmutableTiers = (tiers: Tier[]) => {
    return tiers.map(wc => ({
      items: [...wc.items.map(it => ({ ...it }))],
      winningSpots: [...wc.winningSpots],
    }));
  };
  let artistFilter = (i: SafetyDepositDraft) =>
    !(i.metadata.info.data.creators || []).find((c: Creator) => !c.verified);
  const options: { label: string; value: number }[] = [];
  for (let i = 0; i < props.maxWinners; i++) {
    options.push({ label: `Winner ${i + 1}`, value: i });
  }
  return (
    <>
      <Row className="call-to-action">
        <h2 style={{color: '#000', marginLeft: '0px'}}>Add Winning Tiers and Their Prizes</h2>
        <p>
          Each row represents a tier. You can choose which winning spots get
          which tiers.
        </p>
      </Row>
      {props.attributes.tiers.map((wcg, configIndex) => (
        <Row className="content-action" key={configIndex}>
          <Col xl={24}>
            <h3>Tier #{configIndex + 1} Basket</h3>
          </Col>

          <Checkbox.Group
            options={options}
            onChange={value => {
              const newTiers = newImmutableTiers(props.attributes.tiers);
              const myNewTier = newTiers[configIndex];
              myNewTier.winningSpots = value.map(i => i.valueOf() as number);

              props.setAttributes({
                ...props.attributes,
                tiers: newTiers,
              });
            }}
          />

          {wcg.items.map((i, itemIndex) => (
            <Col className="section" xl={8} key={itemIndex}>
              <Card>
                <ArtSelector
                  filter={artistFilter}
                  selected={
                    (i as TierDummyEntry).safetyDepositBoxIndex !== undefined
                      ? [
                          props.attributes.items[
                            (i as TierDummyEntry).safetyDepositBoxIndex
                          ],
                        ]
                      : []
                  }
                  setSelected={items => {
                    const newItems = [
                      ...props.attributes.items.map(it => ({ ...it })),
                    ];

                    const newTiers = newImmutableTiers(props.attributes.tiers);
                    if (items[0]) {
                      const existing = props.attributes.items.find(
                        it => it.metadata.pubkey === items[0].metadata.pubkey,
                      );
                      if (!existing) newItems.push(items[0]);
                      const index = newItems.findIndex(
                        it => it.metadata.pubkey === items[0].metadata.pubkey,
                      );

                      const myNewTier = newTiers[configIndex].items[itemIndex];
                      myNewTier.safetyDepositBoxIndex = index;
                      if (
                        items[0].masterEdition &&
                        items[0].masterEdition.info.key ==
                          MetadataKey.MasterEditionV1
                      ) {
                        myNewTier.winningConfigType =
                          WinningConfigType.PrintingV1;
                      } else if (
                        items[0].masterEdition &&
                        items[0].masterEdition.info.key ==
                          MetadataKey.MasterEditionV2
                      ) {
                        myNewTier.winningConfigType =
                          WinningConfigType.PrintingV2;
                      } else {
                        myNewTier.winningConfigType =
                          WinningConfigType.TokenOnlyTransfer;
                      }
                      myNewTier.amount = 1;
                    } else if (
                      (i as TierDummyEntry).safetyDepositBoxIndex !== undefined
                    ) {
                      const myNewTier = newTiers[configIndex];
                      myNewTier.items.splice(itemIndex, 1);
                      if (myNewTier.items.length === 0)
                        newTiers.splice(configIndex, 1);
                      const othersWithSameItem = newTiers.find(c =>
                        c.items.find(
                          it =>
                            it.safetyDepositBoxIndex ===
                            (i as TierDummyEntry).safetyDepositBoxIndex,
                        ),
                      );

                      if (!othersWithSameItem) {
                        for (
                          let j =
                            (i as TierDummyEntry).safetyDepositBoxIndex + 1;
                          j < props.attributes.items.length;
                          j++
                        ) {
                          newTiers.forEach(c =>
                            c.items.forEach(it => {
                              if (it.safetyDepositBoxIndex === j)
                                it.safetyDepositBoxIndex--;
                            }),
                          );
                        }
                        newItems.splice(
                          (i as TierDummyEntry).safetyDepositBoxIndex,
                          1,
                        );
                      }
                    }

                    props.setAttributes({
                      ...props.attributes,
                      items: newItems,
                      tiers: newTiers,
                    });
                  }}
                  allowMultiple={false}
                >
                  Select item
                </ArtSelector>

                {(i as TierDummyEntry).winningConfigType !== undefined && (
                  <>
                    <Select
                      defaultValue={(i as TierDummyEntry).winningConfigType}
                      style={{ width: 120 }}
                      onChange={value => {
                        const newTiers = newImmutableTiers(
                          props.attributes.tiers,
                        );

                        const myNewTier =
                          newTiers[configIndex].items[itemIndex];

                        // Legacy hack...
                        if (
                          value == WinningConfigType.PrintingV2 &&
                          myNewTier.safetyDepositBoxIndex &&
                          props.attributes.items[
                            myNewTier.safetyDepositBoxIndex
                          ].masterEdition?.info.key ==
                            MetadataKey.MasterEditionV1
                        ) {
                          value = WinningConfigType.PrintingV1;
                        }
                        myNewTier.winningConfigType = value;
                        props.setAttributes({
                          ...props.attributes,
                          tiers: newTiers,
                        });
                      }}
                    >
                      <Option value={WinningConfigType.FullRightsTransfer}>
                        Full Rights Transfer
                      </Option>
                      <Option value={WinningConfigType.TokenOnlyTransfer}>
                        Token Only Transfer
                      </Option>
                      <Option value={WinningConfigType.PrintingV2}>
                        Printing V2
                      </Option>

                      <Option value={WinningConfigType.PrintingV1}>
                        Printing V1
                      </Option>
                    </Select>

                    {((i as TierDummyEntry).winningConfigType ===
                      WinningConfigType.PrintingV1 ||
                      (i as TierDummyEntry).winningConfigType ===
                        WinningConfigType.PrintingV2) && (
                      <label className="action-field">
                        <span className="field-title">
                          How many copies do you want to create for each winner?
                          If you put 2, then each winner will get 2 copies.
                        </span>
                        <span className="field-info">
                          Each copy will be given unique edition number e.g. 1
                          of 30
                        </span>
                        <Input
                          autoFocus
                          className="input"
                          placeholder="Enter number of copies sold"
                          allowClear
                          onChange={info => {
                            const newTiers = newImmutableTiers(
                              props.attributes.tiers,
                            );

                            const myNewTier =
                              newTiers[configIndex].items[itemIndex];
                            myNewTier.amount = parseInt(info.target.value);
                            props.setAttributes({
                              ...props.attributes,
                              tiers: newTiers,
                            });
                          }}
                        />
                      </label>
                    )}
                  </>
                )}
              </Card>
            </Col>
          ))}
          <Col xl={4}>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                const newTiers = newImmutableTiers(props.attributes.tiers);
                const myNewTier = newTiers[configIndex];
                myNewTier.items.push({});
                props.setAttributes({
                  ...props.attributes,
                  tiers: newTiers,
                });
              }}
              className="action-btn"
            >
              <PlusCircleOutlined />
            </Button>
          </Col>
        </Row>
      ))}
      <Row>
        <Col xl={24}>
          <Button
            type="primary"
            size="large"
            onClick={() => {
              const newTiers = newImmutableTiers(props.attributes.tiers);
              newTiers.push({ items: [], winningSpots: [] });
              props.setAttributes({
                ...props.attributes,
                tiers: newTiers,
              });
            }}
            className="action-btn"
          >
            <PlusCircleOutlined />
          </Button>
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Continue to Review
        </Button>
      </Row>
    </>
  );
};

const ParticipationStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  return (
    <>
      <Row className="call-to-action">
        <h2 style={{color: '#000', marginLeft: '0px'}}>Participation NFT</h2>
        <p>
          Provide NFT that will be awarded as an Open Edition NFT for auction
          participation.
        </p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <ArtSelector
            filter={(i: SafetyDepositDraft) =>
              !!i.masterEdition && i.masterEdition.info.maxSupply === undefined
            }
            selected={
              props.attributes.participationNFT
                ? [props.attributes.participationNFT]
                : []
            }
            setSelected={items => {
              props.setAttributes({
                ...props.attributes,
                participationNFT: items[0],
              });
            }}
            allowMultiple={false}
          >
            Select Participation NFT
          </ArtSelector>
          <label className="action-field">
            <span className="field-title">Price</span>
            <span className="field-info">
              This is an optional fixed price that non-winners will pay for your
              Participation NFT.
            </span>
            <Input
              type="number"
              min={0}
              autoFocus
              className="input"
              placeholder="Fixed Price"
              prefix="◎"
              suffix={props.attributes.quoteMintInfoExtended? props.attributes.quoteMintInfoExtended.symbol
                : props.attributes.quoteMintAddress == WRAPPED_SOL_MINT.toBase58()? "SOL": "CUSTOM"}
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  participationFixedPrice: parseFloat(info.target.value),
                })
              }
            />
          </label>
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Continue to Review
        </Button>
      </Row>
    </>
  );
};

const ReviewStep = (props: {
  confirm: () => void;
  attributes: AuctionState;
  setAttributes: Function;
  connection: Connection;
}) => {
  const [showFundsIssueModal, setShowFundsIssueModal] = useState(false)
  const [cost, setCost] = useState(0);
  const { account } = useNativeAccount();
  useEffect(() => {
    const rentCall = Promise.all([
      props.connection.getMinimumBalanceForRentExemption(MintLayout.span),
      props.connection.getMinimumBalanceForRentExemption(MAX_METADATA_LEN),
    ]);
    // TODO: add
  }, [setCost]);

  const balance = (account?.lamports || 0) / LAMPORTS_PER_SOL;

  let item = props.attributes.items?.[0];

  const handleConfirm = () => {
    props.setAttributes({
      ...props.attributes,
      startListTS: props.attributes.startListTS || moment().unix(),
      startSaleTS: props.attributes.startSaleTS || moment().unix(),
    });
    props.confirm();
  }

  return (
    <>
      <Row className="call-to-action">
        <h2 style={{color: '#000', marginLeft: '0px'}}>Review and list</h2>
        <p>Review your listing before publishing.</p>
      </Row>
      <Row className="content-action">
        <Col xl={12}>
          {item?.metadata.info && (
            <ArtCard pubkey={item.metadata.pubkey} small={true} />
          )}
        </Col>
        <Col className="section" xl={12}>
          <Statistic
            className="create-statistic"
            title="Copies"
            value={
              props.attributes.editions === undefined
                ? 'Unique'
                : props.attributes.editions
            }
          />
          {cost ? (
            <AmountLabel title="Cost to Create" amount={cost} tokenInfo={useTokenList().tokenMap.get(WRAPPED_SOL_MINT.toString())}/>
          ) : (
            <Spin />
          )}
        </Col>
      </Row>
      <Row style={{ display: 'block' }}>
        <Divider />
        <Statistic
          className="create-statistic"
          title="Start date"
          value={
            props.attributes.startSaleTS
              ? moment
                  .unix(props.attributes.startSaleTS as number)
                  .format('dddd, MMMM Do YYYY, h:mm a')
              : 'Right after successfully published'
          }
        />
        <br />
        {props.attributes.startListTS && (
          <Statistic
            className="create-statistic"
            title="Listing go live date"
            value={moment
              .unix(props.attributes.startListTS as number)
              .format('dddd, MMMM Do YYYY, h:mm a')}
          />
        )}
        <Divider />
        <Statistic
          className="create-statistic"
          title="Sale ends"
          value={
            props.attributes.endTS
              ? moment
                  .unix(props.attributes.endTS as number)
                  .format('dddd, MMMM Do YYYY, h:mm a')
              : 'Until sold'
          }
        />
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={() => {
            if (balance < MINIMUM_SAFE_FEE_AUCTION_CREATION) {
              setShowFundsIssueModal(true)
            } else {
              handleConfirm()
            }
          }}
          className="action-btn"
        >
          {props.attributes.category === AuctionCategory.InstantSale
            ? 'List for Sale'
            : 'Publish Auction'}
        </Button>
        <FundsIssueModal
          minimumFunds={0.06}
          currentFunds={balance}
          isModalVisible={showFundsIssueModal}
          onClose={() => setShowFundsIssueModal(false)}
        />
      </Row>
    </>
  );
};

const WaitingStep = (props: {
  createAuction: () => Promise<void>;
  confirm: () => void;
}) => {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const func = async () => {
      const inte = setInterval(
        () => setProgress(prog => Math.min(prog + 1, 99)),
        600,
      );
      await props.createAuction();
      clearInterval(inte);
      props.confirm();
    };
    func();
  }, []);

  return (
    <div
      style={{
        marginTop: 70,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Progress type="circle" percent={progress} />
      <div className="waiting-title">
        Your creation is being listed with Metaplex...
      </div>
      <div className="waiting-subtitle">This can take up to 30 seconds.</div>
    </div>
  );
};

const Congrats = (props: {
  auction?: {
    vault: StringPublicKey;
    auction: StringPublicKey;
    auctionManager: StringPublicKey;
  };
}) => {
  const history = useHistory();

  const newTweetURL = () => {
    const params = {
      text: "I've created a new NFT auction on Metaplex, check it out!",
      url: `${
        window.location.origin
      }/#/listforsale/${props.auction?.auction.toString()}`,
      hashtags: 'NFT,Crypto,Metaplex',
      // via: "Metaplex",
      related: 'Metaplex,Solana',
    };
    const queryParams = new URLSearchParams(params).toString();
    return `https://twitter.com/intent/tweet?${queryParams}`;
  };

  return (
    <>
      <div
        style={{
          marginTop: 70,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div className="waiting-title">
          Congratulations! Your auction is now live.
        </div>
        <div className="congrats-button-container">
          <Button
            className="metaplex-button"
            onClick={_ => window.open(newTweetURL(), '_blank')}
          >
            <span>Share it on Twitter</span>
            <span>&gt;</span>
          </Button>
          <Button
            className="metaplex-button"
            onClick={_ =>
              history.push(`/auction/${props.auction?.auction.toString()}`)
            }
          >
            <span>See it in your auctions</span>
            <span>&gt;</span>
          </Button>
        </div>
      </div>
      <Confetti />
    </>
  );
};
