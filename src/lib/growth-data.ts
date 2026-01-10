
import { ProcessedSheetData } from './types';
import { parse } from 'date-fns';

// Helper to parse the 'Month'yy format
const parseMonthYear = (my: string) => parse(my, "MMM'yy", new Date());

export const growthData: ProcessedSheetData[] = [
  // Aug'24
  { channel: 'AMAZON-B2B', gmv: 1041143, units: 1647, packets: 2098, adsSpent: 0 },
  { channel: 'MEESHO B2C', gmv: 7029877, units: 10453, packets: 14025, adsSpent: 0 },
  { channel: 'SHOPSY B2C', gmv: 6665354, units: 9786, packets: 18041, adsSpent: 0 },
  { channel: 'Amazon Bazaar & B2C', gmv: 817570, units: 1420, packets: 1843, adsSpent: 0 },
  // Sep'24
  { channel: 'AMAZON-B2B', gmv: 1144459, units: 2422, packets: 0, adsSpent: 146774 },
  { channel: 'MEESHO B2C', gmv: 6526335, units: 10712, packets: 0, adsSpent: 3200189 },
  { channel: 'SHOPSY B2C', gmv: 6101438, units: 10491, packets: 0, adsSpent: 378249 },
  { channel: 'Amazon Bazaar & B2C', gmv: 1135744, units: 2085, packets: 0, adsSpent: 76386 },
  // Oct'24
  { channel: 'AMAZON-B2B', gmv: 2078375, units: 4066, packets: 0, adsSpent: 269843 },
  { channel: 'MEESHO B2C', gmv: 4826969, units: 8168, packets: 0, adsSpent: 2236867 },
  { channel: 'SHOPSY B2C', gmv: 8247345, units: 14238, packets: 0, adsSpent: 427465 },
  { channel: 'Amazon Bazaar & B2C', gmv: 1040933, units: 1951, packets: 0, adsSpent: 94700 },
  // Nov'24
  { channel: 'AMAZON-B2B', gmv: 4091156, units: 7767, packets: 0, adsSpent: 753604 },
  { channel: 'MEESHO B2C', gmv: 14156302, units: 24691, packets: 0, adsSpent: 5516423 },
  { channel: 'SHOPSY B2C', gmv: 20216698, units: 38529, packets: 0, adsSpent: 817254 },
  { channel: 'FK MP B2C', gmv: 1029222, units: 2728, packets: 0, adsSpent: 85818 },
  { channel: 'SHOPSY + FK MP Combined B2C', gmv: 690105, units: 954, packets: 0, adsSpent: 799 },
  { channel: 'Amazon Bazaar & B2C', gmv: 1719327, units: 3682, packets: 0, adsSpent: 100753 },
  // Dec'24
  { channel: 'AMAZON-B2B', gmv: 9051632, units: 16569, packets: 0, adsSpent: 1263918 },
  { channel: 'MEESHO B2C', gmv: 24512213, units: 41257, packets: 0, adsSpent: 10287800 },
  { channel: 'SHOPSY B2C', gmv: 39351392, units: 92044, packets: 0, adsSpent: 2073815 },
  { channel: 'FK MP B2C', gmv: 2664591, units: 7838, packets: 0, adsSpent: 306356 },
  { channel: 'SHOPSY + FK MP Combined B2C', gmv: 974632, units: 1690, packets: 0, adsSpent: 18680 },
  { channel: 'Amazon Bazaar & B2C', gmv: 3639223, units: 9528, packets: 0, adsSpent: 334932 },
  // Jan'25
  { channel: 'AMAZON-B2B', gmv: 16862158, units: 32236, packets: 0, adsSpent: 2156792 },
  { channel: 'MEESHO B2C', gmv: 40321736, units: 67614, packets: 0, adsSpent: 13911700 },
  { channel: 'SHOPSY B2C', gmv: 33191906, units: 101878, packets: 0, adsSpent: 1821374 },
  { channel: 'FK MP B2C', gmv: 3787483, units: 12986, packets: 0, adsSpent: 372524 },
  { channel: 'SHOPSY + FK MP Combined B2C', gmv: 1901004, units: 9615, packets: 0, adsSpent: 259046 },
  { channel: 'Amazon Bazaar & B2C', gmv: 5688487, units: 22601, packets: 0, adsSpent: 652525 },
  // Feb'25
  { channel: 'AMAZON-B2B', gmv: 12524688, units: 25782, packets: 0, adsSpent: 1682787 },
  { channel: 'MEESHO B2C', gmv: 28071958, units: 46891, packets: 0, adsSpent: 11180700 },
  { channel: 'SHOPSY B2C', gmv: 24966142, units: 80380, packets: 0, adsSpent: 700443 },
  { channel: 'FK MP B2C', gmv: 3662877, units: 12775, packets: 0, adsSpent: 185543 },
  { channel: 'SHOPSY + FK MP Combined B2C', gmv: 913308, units: 4118, packets: 0, adsSpent: 113987 },
  { channel: 'Amazon Bazaar & B2C', gmv: 4576185, units: 16893, packets: 0, adsSpent: 299356 },
  // Mar'25
  { channel: 'AMAZON-B2B', gmv: 16788651, units: 32017, packets: 0, adsSpent: 2019602 },
  { channel: 'MEESHO B2C', gmv: 25219694, units: 42396, packets: 0, adsSpent: 7718300 },
  { channel: 'SHOPSY B2C', gmv: 19699848, units: 61405, packets: 0, adsSpent: 965957 },
  { channel: 'FK MP B2C', gmv: 3060322, units: 10515, packets: 0, adsSpent: 115741 },
  { channel: 'SHOPSY + FK MP Combined B2C', gmv: 1494548, units: 5068, packets: 0, adsSpent: 114759 },
  { channel: 'Amazon Bazaar & B2C', gmv: 4554870, units: 15583, packets: 0, adsSpent: 233854 },
  // Apr'25
  { channel: 'AMAZON-B2B', gmv: 14895675, units: 28886, packets: 0, adsSpent: 1961047 },
  { channel: 'MEESHO B2C', gmv: 22673348, units: 35852, packets: 0, adsSpent: 5289100 },
  { channel: 'SHOPSY B2C', gmv: 12399474, units: 37162, packets: 0, adsSpent: 623398 },
  { channel: 'FK MP B2C', gmv: 742403, units: 2631, packets: 0, adsSpent: 21827 },
  { channel: 'SHOPSY + FK MP Combined B2C', gmv: 861808, units: 1920, packets: 0, adsSpent: 22211 },
  { channel: 'Amazon Bazaar & B2C', gmv: 1604211, units: 4551, packets: 0, adsSpent: 44038 },
  // May'25
  { channel: 'AMAZON-B2B', gmv: 13413408, units: 26931, packets: 0, adsSpent: 1473618 },
  { channel: 'MEESHO B2C', gmv: 18401029, units: 29271, packets: 0, adsSpent: 6108200 },
  { channel: 'SHOPSY B2C', gmv: 16646518, units: 50129, packets: 0, adsSpent: 645894 },
  { channel: 'FK MP B2C', gmv: 48959, units: 179, packets: 0, adsSpent: 0 },
  { channel: 'SHOPSY + FK MP Combined B2C', gmv: 66174, units: 130, packets: 0, adsSpent: 2436 },
  { channel: 'Amazon Bazaar & B2C', gmv: 115133, units: 309, packets: 0, adsSpent: 2436 },
  // Jun'25
  { channel: 'AMAZON-B2B', gmv: 15167559, units: 30554, packets: 0, adsSpent: 1995662 },
  { channel: 'MEESHO B2C', gmv: 19235077, units: 30423, packets: 0, adsSpent: 7968500 },
  { channel: 'SHOPSY B2C', gmv: 9850990, units: 25137, packets: 0, adsSpent: 458772 },
  { channel: 'Amazon Bazaar & B2C', gmv: 1222957, units: 4223, packets: 0, adsSpent: 57826 },
  // Jul'25
  { channel: 'AMAZON-B2B', gmv: 20226982, units: 41770, packets: 0, adsSpent: 3846117 },
  { channel: 'MEESHO B2C', gmv: 26413722, units: 39978, packets: 0, adsSpent: 10879000 },
  { channel: 'SHOPSY B2C', gmv: 18000327, units: 52544, packets: 0, adsSpent: 373721 },
  { channel: 'Amazon Bazaar & B2C', gmv: 1210758, units: 3752, packets: 0, adsSpent: 38100 },
  // Aug'25
  { channel: 'AMAZON-B2B', gmv: 17656620, units: 34949, packets: 0, adsSpent: 4032675 },
  { channel: 'MEESHO B2C', gmv: 22634013, units: 34682, packets: 0, adsSpent: 10680800 },
  { channel: 'SHOPSY B2C', gmv: 16091460, units: 49269, packets: 0, adsSpent: 368128 },
  { channel: 'Amazon Bazaar & B2C', gmv: 1466587, units: 5232, packets: 0, adsSpent: 37412 },
  // Sep'25
  { channel: 'AMAZON-B2B', gmv: 18712525, units: 37514, packets: 0, adsSpent: 5167398 },
  { channel: 'MEESHO B2C', gmv: 28151375, units: 47361, packets: 0, adsSpent: 14527700 },
  { channel: 'SHOPSY B2C', gmv: 12141197, units: 36340, packets: 0, adsSpent: 253724 },
  { channel: 'Amazon Bazaar & B2C', gmv: 2447110, units: 7406, packets: 0, adsSpent: 66782 },
  { channel: 'JioMart B2C', gmv: 13317, units: 23, packets: 0, adsSpent: 0 },
  { channel: 'Blinkit B2B', gmv: 1996, units: 4, packets: 0, adsSpent: 0 },
  // Oct'25
  { channel: 'AMAZON-B2B', gmv: 15012875, units: 31453, packets: 0, adsSpent: 2866118 },
  { channel: 'MEESHO B2C', gmv: 17700480, units: 29560, packets: 0, adsSpent: 10698400 },
  { channel: 'SHOPSY B2C', gmv: 8946665, units: 25818, packets: 0, adsSpent: 225414 },
  { channel: 'Amazon Bazaar & B2C', gmv: 2035528, units: 5888, packets: 0, adsSpent: 41352 },
  { channel: 'JioMart B2C', gmv: 6468, units: 12, packets: 0, adsSpent: 0 },
  { channel: 'Blinkit B2B', gmv: 998, units: 2, packets: 0, adsSpent: 0 },
  // Nov'25
  { channel: 'AMAZON-B2B', gmv: 16018008, units: 32869, packets: 0, adsSpent: 1899766 },
  { channel: 'MEESHO B2C', gmv: 21719172, units: 35338, packets: 0, adsSpent: 4879400 },
  { channel: 'SHOPSY B2C', gmv: 9139190, units: 22553, packets: 0, adsSpent: 277355 },
  { channel: 'Amazon Bazaar & B2C', gmv: 3408809, units: 11866, packets: 0, adsSpent: 68851 },
  { channel: 'JioMart B2C', gmv: 19328, units: 28, packets: 0, adsSpent: 0 },
].map(item => {
    const date = parseMonthYear(item.channel.startsWith('A') || item.channel.startsWith('M') || item.channel.startsWith('S') || item.channel.startsWith('F') || item.channel.startsWith('J') || item.channel.startsWith('B') ? 'Aug\'24' : 
                   ['AMAZON-B2B', 'MEESHO B2C', 'SHOPSY B2C', 'Amazon Bazaar & B2C'].includes(item.channel) && item.gmv === 1144459 ? 'Sep\'24' :
                   item.gmv === 6526335 ? 'Sep\'24' :
                   item.gmv === 6101438 ? 'Sep\'24' :
                   item.gmv === 1135744 ? 'Sep\'24' :
                   item.gmv === 2078375 ? 'Oct\'24' :
                   item.gmv === 4826969 ? 'Oct\'24' :
                   item.gmv === 8247345 ? 'Oct\'24' :
                   item.gmv === 1040933 ? 'Oct\'24' :
                   item.gmv === 4091156 ? 'Nov\'24' :
                   item.gmv === 14156302 ? 'Nov\'24' :
                   item.gmv === 20216698 ? 'Nov\'24' :
                   item.gmv === 1029222 ? 'Nov\'24' :
                   item.gmv === 690105 ? 'Nov\'24' :
                   item.gmv === 1719327 ? 'Nov\'24' :
                   item.gmv === 9051632 ? 'Dec\'24' :
                   item.gmv === 24512213 ? 'Dec\'24' :
                   item.gmv === 39351392 ? 'Dec\'24' :
                   item.gmv === 2664591 ? 'Dec\'24' :
                   item.gmv === 974632 ? 'Dec\'24' :
                   item.gmv === 3639223 ? 'Dec\'24' :
                   item.gmv === 16862158 ? 'Jan\'25' :
                   item.gmv === 40321736 ? 'Jan\'25' :
                   item.gmv === 33191906 ? 'Jan\'25' :
                   item.gmv === 3787483 ? 'Jan\'25' :
                   item.gmv === 1901004 ? 'Jan\'25' :
                   item.gmv === 5688487 ? 'Jan\'25' :
                   item.gmv === 12524688 ? 'Feb\'25' :
                   item.gmv === 28071958 ? 'Feb\'25' :
                   item.gmv === 24966142 ? 'Feb\'25' :
                   item.gmv === 3662877 ? 'Feb\'25' :
                   item.gmv === 913308 ? 'Feb\'25' :
                   item.gmv === 4576185 ? 'Feb\'25' :
                   item.gmv === 16788651 ? 'Mar\'25' :
                   item.gmv === 25219694 ? 'Mar\'25' :
                   item.gmv === 19699848 ? 'Mar\'25' :
                   item.gmv === 3060322 ? 'Mar\'25' :
                   item.gmv === 1494548 ? 'Mar\'25' :
                   item.gmv === 4554870 ? 'Mar\'25' :
                   item.gmv === 14895675 ? 'Apr\'25' :
                   item.gmv === 22673348 ? 'Apr\'25' :
                   item.gmv === 12399474 ? 'Apr\'25' :
                   item.gmv === 742403 ? 'Apr\'25' :
                   item.gmv === 861808 ? 'Apr\'25' :
                   item.gmv === 1604211 ? 'Apr\'25' :
                   item.gmv === 13413408 ? 'May\'25' :
                   item.gmv === 18401029 ? 'May\'25' :
                   item.gmv === 16646518 ? 'May\'25' :
                   item.gmv === 48959 ? 'May\'25' :
                   item.gmv === 66174 ? 'May\'25' :
                   item.gmv === 115133 ? 'May\'25' :
                   item.gmv === 15167559 ? 'Jun\'25' :
                   item.gmv === 19235077 ? 'Jun\'25' :
                   item.gmv === 9850990 ? 'Jun\'25' :
                   item.gmv === 1222957 ? 'Jun\'25' :
                   item.gmv === 20226982 ? 'Jul\'25' :
                   item.gmv === 26413722 ? 'Jul\'25' :
                   item.gmv === 18000327 ? 'Jul\'25' :
                   item.gmv === 1210758 ? 'Jul\'25' :
                   item.gmv === 17656620 ? 'Aug\'25' :
                   item.gmv === 22634013 ? 'Aug\'25' :
                   item.gmv === 16091460 ? 'Aug\'25' :
                   item.gmv === 1466587 ? 'Aug\'25' :
                   item.gmv === 18712525 ? 'Sep\'25' :
                   item.gmv === 28151375 ? 'Sep\'25' :
                   item.gmv === 12141197 ? 'Sep\'25' :
                   item.gmv === 2447110 ? 'Sep\'25' :
                   item.gmv === 13317 ? 'Sep\'25' :
                   item.gmv === 1996 ? 'Sep\'25' :
                   item.gmv === 15012875 ? 'Oct\'25' :
                   item.gmv === 17700480 ? 'Oct\'25' :
                   item.gmv === 8946665 ? 'Oct\'25' :
                   item.gmv === 2035528 ? 'Oct\'25' :
                   item.gmv === 6468 ? 'Oct\'25' :
                   item.gmv === 998 ? 'Oct\'25' :
                   item.gmv === 16018008 ? 'Nov\'25' :
                   item.gmv === 21719172 ? 'Nov\'25' :
                   item.gmv === 9139190 ? 'Nov\'25' :
                   item.gmv === 3408809 ? 'Nov\'25' :
                   item.gmv === 19328 ? 'Nov\'25' :
                   'Aug\'24' // Default
    );

    const monthStr = ['Aug\'24', 'Sep\'24', 'Oct\'24', 'Nov\'24', 'Dec\'24', 'Jan\'25', 'Feb\'25', 'Mar\'25', 'Apr\'25', 'May\'25', 'Jun\'25', 'Jul\'25', 'Aug\'25', 'Sep\'25', 'Oct\'25', 'Nov\'25'];
    
    // This logic is flawed. We need to associate the data with the correct month.
    // Let's find the month from the provided text data.
    const monthData = {
        '1041143': "Aug'24", '7029877': "Aug'24", '6665354': "Aug'24", '817570': "Aug'24",
        '1144459': "Sep'24", '6526335': "Sep'24", '6101438': "Sep'24", '1135744': "Sep'24",
        '2078375': "Oct'24", '4826969': "Oct'24", '8247345': "Oct'24", '1040933': "Oct'24",
        '4091156': "Nov'24", '14156302': "Nov'24", '20216698': "Nov'24", '1029222': "Nov'24", '690105': "Nov'24", '1719327': "Nov'24",
        '9051632': "Dec'24", '24512213': "Dec'24", '39351392': "Dec'24", '2664591': "Dec'24", '974632': "Dec'24", '3639223': "Dec'24",
        '16862158': "Jan'25", '40321736': "Jan'25", '33191906': "Jan'25", '3787483': "Jan'25", '1901004': "Jan'25", '5688487': "Jan'25",
        '12524688': "Feb'25", '28071958': "Feb'25", '24966142': "Feb'25", '3662877': "Feb'25", '913308': "Feb'25", '4576185': "Feb'25",
        '16788651': "Mar'25", '25219694': "Mar'25", '19699848': "Mar'25", '3060322': "Mar'25", '1494548': "Mar'25", '4554870': "Mar'25",
        '14895675': "Apr'25", '22673348': "Apr'25", '12399474': "Apr'25", '742403': "Apr'25", '861808': "Apr'25", '1604211': "Apr'25",
        '13413408': "May'25", '18401029': "May'25", '16646518': "May'25", '48959': "May'25", '66174': "May'25", '115133': "May'25",
        '15167559': "Jun'25", '19235077': "Jun'25", '9850990': "Jun'25", '1222957': "Jun'25",
        '20226982': "Jul'25", '26413722': "Jul'25", '18000327': "Jul'25", '1210758': "Jul'25",
        '17656620': "Aug'25", '22634013': "Aug'25", '16091460': "Aug'25", '1466587': "Aug'25",
        '18712525': "Sep'25", '28151375': "Sep'25", '12141197': "Sep'25", '2447110': "Sep'25", '13317': "Sep'25", '1996': "Sep'25",
        '15012875': "Oct'25", '17700480': "Oct'25", '8946665': "Oct'25", '2035528': "Oct'25", '6468': "Oct'25", '998': "Oct'25",
        '16018008': "Nov'25", '21719172': "Nov'25", '9139190': "Nov'25", '3408809': "Nov'25", '19328': "Nov'25",
    };
    
    // @ts-ignore
    const month = monthData[item.gmv.toString()] || 'Aug\'24';
    const parsedDate = parseMonthYear(month);

    return {
      ...item,
      date: parsedDate,
      tacos: item.gmv > 0 ? item.adsSpent / item.gmv : 0,
      avgAsp: item.units > 0 ? item.gmv / item.units : 0,
      month: month.split('\'')[0],
      year: '20' + month.split('\'')[1],
      day: '1',
      revenuePerUnit: item.units > 0 ? item.gmv / item.units : 0,
      adsPerUnit: item.units > 0 ? item.adsSpent / item.units : 0,
    };
});
