package com.liveupdates

import com.facebook.react.bridge.ReactApplicationContext

object GlobalReactContext {
    var context: ReactApplicationContext? = null

    fun set(ctx: ReactApplicationContext) {
        context = ctx
    }
}
