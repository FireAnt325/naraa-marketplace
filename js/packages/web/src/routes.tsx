import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
// import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Providers } from './providers';
import {
  AnalyticsView,
  ArtCreateView,
  ArtistsView,
  ArtistView,
  ArtView,
  ArtworksView,
  AuctionCreateView,
  AuctionView,
  HomeView,
  StaticPageView,
  CollectionsView,
  EachCollectionView,
  EachCollectionNFTView,
  GenPosterView,
  MarketView,
  MarketAllView,
  ArtsView,
  ProfileView,
  SaleCreateView,
  ListForSaleView,
  OopsView,
} from './views';
import { AdminView } from './views/admin';
import { PackView } from './views/pack';
import { PackCreateView } from './views/packCreate';
import { BillingView } from './views/auction/billing';
import { SalesListView } from './views/home/components/SalesList'

export function Routes() {
  const shouldEnableNftPacks = process.env.NEXT_ENABLE_NFT_PACKS;
  return (
    <>
      <HashRouter basename={'/'}>
      {/* <BrowserRouter basename={'/'}> */}
        <Providers>
          <Switch>
            <Route exact path="/admin" component={() => <AdminView />} />
            {shouldEnableNftPacks && (
              <Route
                exact
                path="/admin/pack/create/:stepParam?"
                component={() => <PackCreateView />}
              />
            )}
            <Route
              exact
              path="/analytics"
              component={() => <AnalyticsView />}
            />
            <Route
              exact
              path="/art/create/:step_param?"
              component={() => <ArtCreateView />}
            />
            <Route
              exact
              path="/artworks/:id?"
              component={() => <ArtworksView />}
            />
            <Route exact path="/art/:id" component={() => <ArtView />} />
            <Route exact path="/artists/:id" component={() => <ArtistView />} />
            <Route exact path="/artists" component={() => <ArtistsView />} />

            {shouldEnableNftPacks && (
              <Route exact path="/pack/:id?" component={() => <PackView />} />
            )}
            <Route
              exact
              path="/auction/create/:step_param?"
              component={() => <AuctionCreateView />}
            />
            <Route
              exact
              path="/auction/:id"
              component={() => <AuctionView />}
            />
            <Route
              exact
              path="/auction/:id/billing"
              component={() => <BillingView />}
            />
            <Route path="/about" component={() => <StaticPageView />} />

            <Route
              exact
              path="/poster/:id"
              component={() => <GenPosterView />}
            />
            <Route
              exact
              path="/collections/:collection_id/:nft_id"
              component={() => <EachCollectionNFTView />}
            />
            <Route
              exact
              path="/collections/:collection_id"
              component={() => <EachCollectionView />}
            />
            <Route
              exact
              path="/collections"
              component={() => <CollectionsView />}
            />
            
            <Route
              exact
              path="/arts"
              component={() => <ArtsView />}
            />
            <Route 
              exact path="/marketall/:id"
              component={() => <MarketAllView />} 
            />
            <Route
              exact
              path="/market"
              component={() => <MarketView />}
            />

            <Route
             exact path="/profile"
             component={() => <ProfileView />}
            />

            <Route
              exact
              path="/listforsale"
              component={() => <SaleCreateView />}
            />

            <Route
              exact
              path="/salesList"
              component={() => <SalesListView />}
            />

            <Route
              exact
              path="/oops"
              component={() => <OopsView />}
            />

            <Route path="/" component={() => <HomeView />} />
          </Switch>
        </Providers>
      </HashRouter>
      {/* </BrowserRouter> */}
    </>
  );
}
