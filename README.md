# Reactance
A [resistance](http://en.m.wikipedia.org/wiki/The_Resistance_(game)) game helper written in react.

![Screenshot](/images/screenshots.png?raw=true)

# Use
Go to [http://mlsteele.github.io/reactance/](http://mlsteele.github.io/reactance/) on your phone to start playing. 

First, add the players and select the Avalon roles you'd like to use (they are described [on wikipedia](http://en.m.wikipedia.org/wiki/The_Resistance_(game)#Avalon_variant)). When you hit *New Game*, it shuffles the roles and brings you to the Roles page. Pass the phone around and everyone can see their role, as well as any additional info (if they are a spy, they can see who the other spies are). Once that is done, go to the Mission tab to start playing. The numbers at the top of the page show how many people go on each mission, as well as keep track of the result of previous missions. Red means the mission failed, black means passed, and gray means it hasn't been gone on yet. During mission voting, you can hit reset at any time and it will clear the current mission.

## Run on your computer
Run `make` to build the javascript and css bundles.
Then navigate to index.html in your browser.

# Development
Run `make` to build the js and less bundles.
Run `make watch` to run the watchers to continuously
build js and less for development.
