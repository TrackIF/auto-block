# auto-block
Simplified controller creation built around async.auto

## Example usage

    var handler = {
        context: context,
        event: event,
        optionsMapping: {
        'slug': 'event.slug',
        'feed': 'event.feed',
        'dryrun': 'event.dryrun'
        },
        responseMapping: 'results.query'
    }

    handler.block = {
        'options': {
            value: options
        },
        'feedConfig': {
            func: helpers.clients.getClientConfig,
            after: ['options'],
            with: [
            'options.slug',
            'options.feed'
            ]
        },
        'redshiftPassword': {
            func: helpers.secrets.kmsDecrypt,
            after: ['feedConfig'],
            with: {
            'payload': 'feedConfig.import.redshiftPassword'
            }
        }
    }

    autoBlock.run(handler, context.done)
