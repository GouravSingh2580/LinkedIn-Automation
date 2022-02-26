const puppeteer = require('puppeteer');
const fs = require('fs');
const csvReader = require('csv-parser');

const scrapeCompany = async (companyName, searchTerm) => {
    const browser = await puppeteer.launch({
        headless: true,
    });
    const page = await browser.newPage();
    await page.goto('https://google.com');
    let company = companyName.toLowerCase();
    let myLocalValue = `site:linkedin.com \"@${company}.com\" \"${searchTerm}\" email`;
    await page.$eval('input[name=q]', (el, value) => el.value = value, myLocalValue);
    page.keyboard.press('Enter');
    await page.waitForNavigation();
    return await page.evaluate((company) => {
        function extractEmails(text) {
            return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
        }
        let results = [...document.querySelectorAll('.g')];
        let temp = [];
        for (const elem of results) {
            if(extractEmails(elem.innerText)!=null)
            temp.push({
                company: company,
                link: elem.querySelector('a').href.replace(/(\r\n|\n|\r)/gm, ""),
                email: extractEmails(elem.innerText)
            });
        }
        return temp;
    }, company);
    browser.close();
};

const driver = async () => {
    var searchTerm = 'recruiter';
    var arr = [];
    var results = [];
    fs.createReadStream('input.csv')
        .pipe(csvReader())
        .on('data', (row) => {
            arr.push(row.company);
        })
        .on('end', async () => {
            console.log('CSV file successfully processed');
            for (const company of arr) {
                console.log(`Company ${company} is being processed`);
                companySearch = await scrapeCompany(company, searchTerm);
                results = [...results, ...companySearch];
            }
            let data = results;
            console.log(data)
        });
};
driver();
