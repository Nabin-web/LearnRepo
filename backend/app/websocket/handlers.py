from app.socket_manager import sio

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def join_store(sid, data):
    store_id = data.get('storeId')
    if store_id:
        sio.enter_room(sid, store_id)
        print(f"Client {sid} joined store {store_id}")
        await sio.emit('user_joined', {'sid': sid}, room=store_id)
        # Count users in the room and broadcast
        room_members = sio.rooms(sid) if hasattr(sio, 'rooms') else []
        user_count = 0
        if hasattr(sio.manager, 'rooms'):
            user_count = len(sio.manager.rooms['/'].get(store_id, {}))
        await sio.emit('active_user_count', {'count': user_count}, room=store_id)

@sio.event
async def leave_store(sid, data):
    store_id = data.get('storeId')
    if store_id:
        sio.leave_room(sid, store_id)
        print(f"Client {sid} left store {store_id}")
        await sio.emit('user_left', {'sid': sid}, room=store_id)
        # Count users in the room and broadcast
        user_count = 0
        if hasattr(sio.manager, 'rooms'):
            user_count = len(sio.manager.rooms['/'].get(store_id, {}))
        await sio.emit('active_user_count', {'count': user_count}, room=store_id)

@sio.event
async def model_moved(sid, data):
    store_id = data.get('storeId')
    if store_id:
        # Broadcast to others in the room
        await sio.emit('model_position_updated', data, room=store_id, skip_sid=sid)
