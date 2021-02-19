# Setup / Running

This should be a fairly standard Node project, so the usual yarn/npm commands should work.

`npm dev` or `node app.js` will start a demo server on `localhost:8000`

`npm test` will run unit tests.

# Overview

This is a basic rate-limiting module in Node.

I tried to keep it as composable as possible, so it's not tied to any particular server / framework. You could throw it into any old function call, and it would handle the rate-limiting just fine, although the response to the user as a result of being rate-limited is left up to the caller.

Supplying an appropriate ID so that different callers can be distinguished is also left as an exercise for the caller.

I tried to use a fairly functional style - although there's more mutable state drifting around than I'd like. Relatedly, the choice *not* to make use of JS's object-oriented features is also intentional. I'm quite happy to talk about that in an interview.

I implemented a couple of different strategies and a couple of different datastores. I personally find that the easiest way to make something modular / extensible / composable is to actually have a go at doing those things and see what in the code needs to change to support it.

## Areas for improvement

The main area I know this can be improved is that it probably wouldn't handle multiple concurrent requests well (e.g. if you set it up in an AWS Lambda with a Redis backend or something), in the sense that it's currently possible to have two of these reading/writing the datastore at the same time, and there's no mechanism to ensure that that concurrency is handled correctly. Doing it probably wouldn't be too hard, but you'd have to integrate more tightly with something like Redis in order to take advantage of its concurrency and transaction primitives.

The other main area that I'm not especially happy with is how the interface for the strategies turned out. I find it's always a balancing act between 'Don't repeat yourself' and 'Clear, readable code', and I think I fell a bit too far towards being DRY in that case.

Also, I'm not *actually* very familiar with Node, I've just been writing a lot of front-end JS recently, so there might be some idiosyncrasies or things that don't line up with convention in terms of how I've structured this as a Node project.

# Redis

One of the options for a datastore is to use Redis, which obviously requires a Redis server to be running. `brew install redis` and running it with the default configuration worked for me, if you want to try it out. You'll also need to swap which store is used in `app.js`. If it can detect that Redis is running, some of the tests will also make use it.

# Fun fact

I think this is the first time I've actually written a `while` loop in about... 4 years? (Previous job was writing Haskell, which doesn't have loops built into the language.)