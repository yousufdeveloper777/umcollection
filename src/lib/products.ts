import blackHandbag from "@/assets/black-handbag.jpeg.asset.json";
import burgundySuit from "@/assets/burgundy-suit.jpeg.asset.json";
import miniHandbags from "@/assets/mini-handbags.jpeg.asset.json";
import luxuryWatchSet from "@/assets/luxury-watch-set.jpeg.asset.json";
import pearlBowHeels from "@/assets/pearl-bow-heels.jpeg.asset.json";
import pearlJewellery from "@/assets/pearl-jewellery.jpeg.asset.json";
import smartwatchBundle from "@/assets/smartwatch-bundle.jpeg.asset.json";
import walletPhoto from "@/assets/wallet.jpeg.asset.json";
import watchCollection from "@/assets/watch-collection.jpeg.asset.json";
import whiteChainHandbag from "@/assets/white-chain-handbag.jpeg.asset.json";

import velvetDress from "@/assets/burgundy-velvet-dress.jpeg.asset.json";
import bowDress from "@/assets/bow-detail-dress.jpeg.asset.json";
import twoPiece from "@/assets/black-two-piece-suit.jpeg.asset.json";
import blackDress from "@/assets/black-layered-dress.jpeg.asset.json";
import navyDress from "@/assets/navy-layered-dress.jpeg.asset.json";
import loungewear from "@/assets/satin-loungewear.jpeg.asset.json";

export type Category = "Suits" | "Dresses" | "Loungewear" | "Jewellery" | "Bags" | "Shoes" | "Watches" | "Accessories";

export type Product = {
  name: string;
  category: Category;
  image: string;
  imageAlt: string;
};

export const products: Product[] = [
  {
    name: "Embroidered Suit",
    category: "Suits",
    image: burgundySuit.url,
    imageAlt: "Model wearing an ornate burgundy embroidered suit",
  },
  {
    name: "Pearl Jewellery Set",
    category: "Jewellery",
    image: pearlJewellery.url,
    imageAlt: "Pearl necklace and matching jewellery set",
  },
  {
    name: "Classic Handbag",
    category: "Bags",
    image: blackHandbag.url,
    imageAlt: "Structured black handbag",
  },
  {
    name: "Chain-Detail Handbag",
    category: "Bags",
    image: whiteChainHandbag.url,
    imageAlt: "White handbag with a decorative chain strap",
  },
  {
    name: "Mini Handbag Collection",
    category: "Bags",
    image: miniHandbags.url,
    imageAlt: "Collection of mini handbags in several colours",
  },
  {
    name: "Watch Collection",
    category: "Watches",
    image: watchCollection.url,
    imageAlt: "Assorted watches arranged in a presentation box",
  },
  {
    name: "Luxury Watch Set",
    category: "Watches",
    image: luxuryWatchSet.url,
    imageAlt: "Four luxury wristwatches in an illuminated presentation box",
  },
  {
    name: "Smartwatch Bundle",
    category: "Watches",
    image: smartwatchBundle.url,
    imageAlt: "Smartwatch with wireless earbuds and a set of interchangeable straps",
  },
  {
    name: "Pearl Bow Heels",
    category: "Shoes",
    image: pearlBowHeels.url,
    imageAlt: "Pointed slingback heels with pearl bows in silver, black and champagne gold",
  },
  {
    name: "Everyday Wallet",
    category: "Accessories",
    image: walletPhoto.url,
    imageAlt: "Black patterned wallet",
  },
  { name: "Burgundy Velvet Dress", category: "Dresses", image: velvetDress.url, imageAlt: "Burgundy velvet long dress outdoors" },
  { name: "Bow-Detail Dress", category: "Dresses", image: bowDress.url, imageAlt: "Black and white long dress with bow details" },
  { name: "Black Two-Piece Suit", category: "Suits", image: twoPiece.url, imageAlt: "Black embroidered shirt and matching trousers" },
  { name: "Black Layered Dress", category: "Dresses", image: blackDress.url, imageAlt: "Black long dress with cropped jacket" },
  { name: "Navy Layered Dress", category: "Dresses", image: navyDress.url, imageAlt: "Navy blue long dress with matching jacket" },
  { name: "Satin Loungewear Set", category: "Loungewear", image: loungewear.url, imageAlt: "Black satin loungewear with white piping" },
];

