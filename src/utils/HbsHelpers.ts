import helpers from 'handlebars-helpers';
import moment from 'moment-timezone';
import _ from 'lodash';

const hbsHelpers = helpers();
hbsHelpers['moment'] = (context: any, block: Handlebars.HelperOptions) => {
    if (context?.hash) { block = _.cloneDeep(context); context = undefined }
    let date: any = moment(context),
        hasFormat = false;
    date.locale('en');
    if (block.hash.timezone) date.tz(block.hash.timezone);

    for (let i in block.hash) {
        if (i === 'format') hasFormat = true;
        else if (date[i]) date = date[i](block.hash[i]);
        else console.log(`moment.js does not support "${i}"`);
    }
    if (hasFormat) date = date.format(block.hash.format);
    return date;
};
hbsHelpers['duration'] = (context: any, block: Handlebars.HelperOptions) => {
    if (context?.hash) { block = _.cloneDeep(context); context = 0; }
    let duration: any = moment.duration(context),
        hasFormat = false;
    duration = duration.locale('en');

    for (let i in block.hash) {
        if (i === 'format') hasFormat = true;
        else if (duration[i]) duration = duration[i](block.hash[i]);
        else console.log(`moment.js duration does not support "${i}"`);
    }

    if (hasFormat) duration = duration.format(block.hash.format);
    return duration;
}
//@ts-ignore
Object.keys(_).filter(k => !['each'].includes(k)).forEach(k => hbsHelpers[k] = _[k]);

export default hbsHelpers;