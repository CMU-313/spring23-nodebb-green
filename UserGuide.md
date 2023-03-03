## User story 1
As a student, I want to post private questions to instructors only instead of the entire class, so that I can include private information or ask questions about my homework solutions.

### How to use:
1. Navigate to any topic category on the NodeBB platform, and click the `New Topic` button to create a new topic.*
   ![image](https://user-images.githubusercontent.com/50491000/222633743-284b3181-a80b-4d51-92eb-81e90c1a1816.png)

2. When the topic composer is open, you should see a `Private` toggle. Click the toggle to make your topic private, and submit.
   Your new private topic:
   ![image](https://user-images.githubusercontent.com/50491000/222633793-23e34644-d6e1-428b-a491-90c2ef37deca.png)

3. Log out to see that your new private topic will not be visible.
   ![image](https://user-images.githubusercontent.com/50491000/222633828-dfafe3a7-ef76-4b2e-a035-a9b1121c7a66.png)

*If this isn't showing up, you may need to run `patch-package`

### Automated testing:
Automated tests have been added to the `test/topics.js` file found here in the repository.

* Test that the private toggle creates a topic with a true `privateTopic` attribute
* Test that by default topics are created with a false `privateTopic` attribute

These tests are sufficient because the `private` toggle is a UI heavy feature, so it is only necessary to test the API endpoints it touches.

## User story 2
As an instructor, I want to mark questions as resolved, so that I can tell which questions are still unanswered.

### How to use
1. Navigate to any topic on the NodeBB platform.
2. Once you click into a topic you should be able to see the “resolve” button which is circled in the screenshot below.
   ![image](https://user-images.githubusercontent.com/50491000/222633942-8c42dc50-941c-4772-ba69-328a68c4246c.png)
3. Click this button to show topic status as resolved.
4. Once you have clicked on the button the button will now disable and become unclickable indicating that the post has already been resolved.
   ![image](https://user-images.githubusercontent.com/50491000/222633971-866e62cd-f72e-4439-93ed-a9919ef23e8d.png)

### Automated testing:
Automated tests have been added to the `test/topics.js` file found here in the repository.
* Test that the resolve button creates a topic with a true `resolve` attribute
* Test that by default topics are created with a false `resolve` attribute
These tests are sufficient because the `resolve` button should be clickable and once clicked should no longer be clickable. As these tests do gauge that functionality, they are therefore sufficient. 
