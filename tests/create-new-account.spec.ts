import { test, expect } from '@playwright/test';
const { readFileSync } = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
let execEnv = { env: { ...process.env, FORCE_COLOR: "0" } };

let testDataJson = 'tests/register-business.json';
let OrgName  = 'tracking02';
let clearTestDataBefore = true;
let clearTestDataAfter  = false;

test('create-new-account', async ({ page }) => 
{
	console.log(test.info().title);
	test.slow();
	
	// load test data json
	let testData = readFileSync(testDataJson);
	var testDataJObj = JSON.parse(testData);

	// clear test data
	if (clearTestDataBefore)
	{
		try
		{
			console.log('Clearing test data.');
			let sfOutput = await exec('sf data:delete:record -o '+OrgName+' --json -s Account --where "Name=\'' + testDataJObj.businessName + '\'"', execEnv);
			var jsonObj = JSON.parse(sfOutput.stdout.trim());
			console.log('Success: ' + jsonObj.result.success);
		}
		catch (error)
		{
			console.log('No matching record found.');
		}
	}

	// Get SF pre-authenticated URL
	let sfOutput = await exec('sf org:open -o '+OrgName+' --path /lightning/page/home --url-only --json', execEnv);
	var jsonObj = JSON.parse(sfOutput.stdout.trim());
	let SF_URL = jsonObj.result.url;

	// start test here
	await page.goto(SF_URL);

	// open Accounts tab
	await page.getByRole('link', { name: 'Accounts' }).click();
	
	// Select Record Type
	await page.getByRole('button', { name: 'New' }).click();
	await page.getByText('Business/Premise').click();
	await page.getByRole('button', { name: 'Next' }).click();

	// Fill in Account details
	await page.getByLabel('*Account Name').click();
	await page.getByLabel('*Account Name').fill(testDataJObj.businessName);

	await page.getByRole('textbox', { name: 'Phone' }).click();
	await page.getByRole('textbox', { name: 'Phone' }).fill(testDataJObj.businessPhone);

	await page.getByLabel('Billing Street').click();
	await page.getByLabel('Billing Street').fill(testDataJObj.premiseAddr);

	await page.getByLabel('Billing City').click();
	await page.getByLabel('Billing City').fill(testDataJObj.premiseCity);

	await page.getByLabel('Billing State/Province').click();
	await page.getByLabel('Billing State/Province').fill(testDataJObj.premiseState);

	await page.getByLabel('Billing Zip/Postal Code').click();
	await page.getByLabel('Billing Zip/Postal Code').fill(testDataJObj.premisePostCode);

	await page.getByLabel('Billing Country').click();
	await page.getByLabel('Billing Country').fill(testDataJObj.premiseCountry);

	// click Save
	await page.getByRole('button', { name: 'Save', exact: true }).click();

	// Assert result
	await page.waitForURL('**/view');
	await page.waitForSelector('records-highlights2');
	await expect(page.locator('records-highlights2')).toContainText(testDataJObj.businessName);

	// Get record Id from URL
	let url = new URL(page.url());
	let path_split = url.pathname.split('/');
	// console.log(path_split);

	// Assert URL
	expect(path_split[3]).toBe('Account');
	expect(path_split[5]).toBe('view');
	let AccountId = path_split[4];
	console.log('AccountId: ' + AccountId);

	// ** Test has passed!
	console.log(test.info().title + ': Test Passed!');

	// clear test data.
	if (clearTestDataAfter)
	{
		try
		{
			console.log('Clearing test data.');
			let sfOutput = await exec('sf data:delete:record -o '+OrgName+' --json -s Account --where "Id=\'' + AccountId + '\'"', execEnv);
			var jsonObj = JSON.parse(sfOutput.stdout.trim());
			console.log('Success: ' + jsonObj.result.success);
		}
		catch (error)
		{
			console.log('No matching record found.');
		}
	}
});
