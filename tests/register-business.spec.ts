import { test, expect } from '@playwright/test';
const { readFileSync } = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
let execEnv = { env: { ...process.env, FORCE_COLOR: "0" } };

let testDataJson = 'tests/register-business.json';
let SiteName = 'VisitTracker';
let OrgName  = 'tracking02';
let clearTestDataBefore = true;
let clearTestDataAfter  = false;

test('register-business', async ({ page }) => 
{
	console.log(test.info().title);

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

	// Get SF Site URL
	let sfOutput = await exec('sf data:query -o '+OrgName+' --json -q "SELECT Id, GuestUserId FROM Site WHERE Name = \'' + SiteName + '\'" -w 100', execEnv);
	var jsonObj = JSON.parse(sfOutput.stdout.trim());
	let SF_SITE_ID = jsonObj.result.records[0].Id;

	sfOutput = await exec('sf data:query -o '+OrgName+' --json -q "SELECT SecureURL FROM SiteDetail WHERE DurableId = \'' + SF_SITE_ID + '\'" -w 100', execEnv);
	jsonObj = JSON.parse(sfOutput.stdout.trim());
	let SF_SITE_URL = jsonObj.result.records[0].SecureUrl;

	// start test here
	await page.goto(SF_SITE_URL);
	await page.getByRole('link', { name: 'Register My Business for' }).click();

	await page.getByPlaceholder('My Business Pty Ltd').click();
	await page.getByPlaceholder('My Business Pty Ltd').fill(testDataJObj.businessName);

	await page.getByPlaceholder('9100 1000').click();
	await page.getByPlaceholder('9100 1000').fill(testDataJObj.businessPhone);

	await page.getByPlaceholder('Swanston Street').click();
	await page.getByPlaceholder('Swanston Street').fill(testDataJObj.premiseAddr);

	await page.getByPlaceholder('Melbourne').click();
	await page.getByPlaceholder('Melbourne').fill(testDataJObj.premiseCity);

	await page.getByPlaceholder('VIC').click();
	await page.getByPlaceholder('VIC').fill(testDataJObj.premiseState);

	await page.getByPlaceholder('3001').click();
	await page.getByPlaceholder('3001').fill(testDataJObj.premisePostCode);

	await page.getByPlaceholder('Australia').click();
	await page.getByPlaceholder('Australia').fill(testDataJObj.premiseCountry);

	await page.getByPlaceholder('First name').click();
	await page.getByPlaceholder('First name').fill(testDataJObj.contactFirstName);

	await page.getByPlaceholder('Last name').click();
	await page.getByPlaceholder('Last name').fill(testDataJObj.contactLastName);

	await page.getByPlaceholder('100 200').click();
	await page.getByPlaceholder('100 200').fill(testDataJObj.contactPhone);

	await page.getByPlaceholder('contact@mybusiness.com.au').click();
	await page.getByPlaceholder('contact@mybusiness.com.au').fill(testDataJObj.contactEmail);

	await page.getByRole('button', { name: 'Submit My Details' }).click();

	// test our result
	await expect(page.locator('body')).toContainText('Thank You');

	// Get the thank you page Id value from the URL
	let url = new URL(page.url());
	const urlParams = new URLSearchParams(url.search);
	expect(urlParams.has('id')).toBeTruthy();
	let pageGUID = urlParams.get('id');

	// Query SF and get Account Id, GUID.
	sfOutput = await exec('sf data:query -o '+OrgName+' --json -q "SELECT Id, Name, GUID__c FROM Account WHERE Name=\'' + testDataJObj.businessName + '\' ORDER BY CreatedDate DESC LIMIT 1" -w 100', execEnv);
	jsonObj = JSON.parse(sfOutput.stdout.trim());
	let AccountId   = jsonObj.result.records[0].Id;
	let AccountName = jsonObj.result.records[0].Name;
	let AccountGUID = jsonObj.result.records[0].GUID__c;

	// verify the account name and account GUID
	expect(AccountName).toBe(testDataJObj.businessName);
	expect(AccountGUID).toBe(pageGUID);

	// ** Test has passed!
	console.log(test.info().title + ': Test Passed!');

	// clear test data
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