import { buildGraphqlVariables, encodeRestliValue, restliList } from 'src/linkedin/restli.util';

describe('encodeRestliValue', () => {
  it('encodes colons, commas and parentheses the way the LinkedIn SPA does', () => {
    expect(encodeRestliValue('urn:li:msg_conversation:(urn:li:fsd_profile:ACoAA1,2-abc==)')).toBe(
      'urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA1%2C2-abc%3D%3D%29',
    );
  });
});

describe('buildGraphqlVariables', () => {
  it('keeps numbers raw and encodes strings', () => {
    expect(buildGraphqlVariables({ mailboxUrn: 'urn:li:fsd_profile:ME', count: 20 })).toBe(
      '(mailboxUrn:urn%3Ali%3Afsd_profile%3AME,count:20)',
    );
  });
});

describe('restliList', () => {
  it('encodes the items but keeps the List wrapper and separators raw', () => {
    expect(
      buildGraphqlVariables({
        mailboxUrn: 'urn:li:fsd_profile:ME',
        recipients: restliList(['urn:li:fsd_profile:A', 'urn:li:fsd_profile:B']),
      }),
    ).toBe('(mailboxUrn:urn%3Ali%3Afsd_profile%3AME,recipients:List(urn%3Ali%3Afsd_profile%3AA,urn%3Ali%3Afsd_profile%3AB))');
  });
});
