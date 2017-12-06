import * as getStream from 'get-stream';

import * as config from '../../config';

import * as remoteResource from '../remote-resource';

import {Context}      from './rule';
import {htmlRules} from './rules';
import {Transform}    from './transform';

it(`${Transform.name} applies all HTML rules successfully`, async () => {
    const context: Context = {
        contentType: 'text/html',
        path: 'https://www.example.com/test.html',
        remoteResourceCodec: new remoteResource.Codec(config.routeBase, config.refererQueryParam)
    };
    const content: string = `
        <meta name="test" content="https://www.example.com/meta1">
        <meta content='//www.example.com/meta2' name='test' />
        <meta name = "test"
              content = "//www.example.com/meta3">
        </meta>

        <link rel="stylesheet" href="https://www.example.com/syle1.css">
        <link href='//www.example.com/style2.css' rel='stylesheet' />
        <link rel = "stylesheet"
              href = "https://www.example.com/style3.css">
        </link>

        <style>
            .test1 {
                background-image: url("https://www.example.com/image1.png");
            }
            .test2 {
                background-image: url('//www.example.com/image2.png');
            }
        </style>
        <style type = "text/css">.test3 { background-image: url(https://www.example.com/image3.png); }</style>

        <script src="https://www.example.com/script1.js"></script>
        <script type = 'application/javascript'
                src = '//www.example.com/script2.js'>
        </script>
        <script>
            const url = 'https://www.example.com/script3.js';
        </script>`;

    const transform = new Transform(context, htmlRules, '');
    transform.write(content);
    transform.end();
    const actual: string = await getStream(transform);

    expect(actual).toMatchSnapshot();
});
