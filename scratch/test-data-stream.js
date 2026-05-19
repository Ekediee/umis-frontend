const stream = new ReadableStream({
  start(controller) {
    const enc = new TextEncoder();
    controller.enqueue(enc.encode('0:"Hello"\n'));
    controller.enqueue(enc.encode('0:" World"\n'));
    controller.close();
  }
});
