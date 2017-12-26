# MPH Dock

A lightweight Mac OS tray application that provides quick access to account balances on [Mining Pool Hub](https://miningpoolhub.com).

![screenshot](https://i.imgur.com/yQmDxZd.jpg)

The app sits in the top menu bar and shows the account balance of the auto-exchange coin. A full balance breakdown of all coins is shown upon selection.

Built with [Electron](http://electron.atom.io), uses the [Mining Pool Hub API](https://github.com/miningpoolhub/php-mpos/wiki/API-Reference).

## Setup

```sh
git clone https://github.com/ipaulpro/mph-dock
```


Edit `mph-dock/app/data/constants.js` to add your Mining Pool Hub API key, and specify the auto exchange coin you're currently using.

```javascript 1.6
API_KEY: '', // Your Mining Pool Hub API key, found at https://miningpoolhub.com/?page=account&action=edit
AUTO_EXCHANGE: 'BTC' // The symbol of your Auto Exchange Coin (BTC, ETH, LTC, etc.)
```

## Running

```sh
cd path/to/mph-dock
npm install
npm start
```

## Packaging

```sh
npm run package
open out/MPH-Dock-darwin-x64/MPH Dock.app
```

## Notes

Currently only Mac OS is supported, and only a dark-theme icon is provided. Stats are refreshed every 10 minutes.

Plans include: 
- Look into Windows and Linux support
- Add tabs for Worker stats and Auto Exchange Coin balance history
- Provide choices for refresh period
- Provide choices for menu bar display
- Provide initial setup allowing user to add API key and specify AE coin from prebuilt binary

Pull requests are welcome for these, and any other features.

## Credits

Created by [Paul Burke](https://github.com/ipaulpro)

#### Acknowledgements

Inspired by, and uses code from [Bitdock](https://github.com/chrisunderdown/bitdock) by [Chris Underdown](http://twitter.com/chrisunderdown)

Inspired by [MiningPoolHubStats](https://github.com/jimok82/MiningPoolHubStats)

## Licenses

    Copyright (C) 2017 Paul Burke
    
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    
      http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
    
Bitdock:

```
Copyright 2017 Chris Underdown

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```