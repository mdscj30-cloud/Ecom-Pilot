
import { ProcessedSheetData } from './types';
import { parse } from 'date-fns';

// Helper to parse the 'Month'yy format
const parseMonthYear = (my: string) => parse(my, "MMM'yy", new Date());

export const growthData: ProcessedSheetData[] = [].map(item => {
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
