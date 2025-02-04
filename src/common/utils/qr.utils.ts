import nodeCanvas from 'canvas';
import { JSDOM } from 'jsdom';
import { QRCodeStyling } from 'qr-code-styling/lib/qr-code-styling.common.js';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

export class QRUtils {
  static generateQRCode = async (referralCode) => {
    const options = {
      nodeCanvas,
      jsdom: JSDOM,
      data: referralCode,
      image: '',
      dotsOptions: {
        color: '#000000',
        type: 'rounded',
        roundSize: true,
      },
      backgroundOptions: {
        round: 0.2,
        color: '#FFFFFF',
      },
      width: 160,
      height: 160,
      type: 'png',
      shape: 'square',
      imageOptions: {
        hideBackgroundDots: true,
        crossOrigin: 'anonymous',
        margin: 0,
        imageSize: 0.4,
        saveAsBlob: true,
      },
      cornersSquareOptions: {
        color: '#222222',
        type: 'extra-rounded',
        gradient: {
          type: 'linear',
          rotation: 180,
          colorStops: [
            { offset: 0, color: '#000000' },
            { offset: 1, color: '#000000' },
          ],
        },
      },
      cornersDotOptions: {
        color: '#222222',
        type: 'dot',
        gradient: {
          type: 'linear',
          rotation: 180,
          colorStops: [
            { offset: 0, color: '#000000' },
            { offset: 1, color: '#000000' },
          ],
        },
      },
    };

    const qrCodeImage = new QRCodeStyling(options);

    try {
      const buffer = await qrCodeImage.getRawData('png');
      return buffer;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };
}
