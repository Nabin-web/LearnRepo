from app.socket_manager import sio
from app.services.store_service import StoreService

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    # Find all rooms the client was in and update activeUsers for store rooms
    try:
        # Get all rooms for this session before socket.io cleans them up
        session_rooms = sio.manager.get_rooms(sid, namespace='/')
        for room in session_rooms:
            # Check if this is a store room (not the default sid room)
            # Store rooms are just the store_id string
            if room != sid:
                # Count remaining users in the room (sid will be removed by socket.io after this)
                # So we subtract 1 from the current count
                room_dict = sio.manager.rooms['/'].get(room, {})
                current_count = len(room_dict) if room_dict else 0
                # The sid is still in the dict, so subtract 1 for the disconnecting user
                user_count = max(0, current_count - 1)
                # Update database
                await StoreService.update_active_users(room, user_count)
                # Broadcast updated count
                await sio.emit('active_user_count', {'count': user_count}, room=room)
    except Exception as e:
        print(f"Error handling disconnect for {sid}: {e}")

@sio.event
async def join_store(sid, data):
    store_id = data.get('storeId')
    if store_id:
        # Check current user count before allowing join
        current_count = 0
        if hasattr(sio.manager, 'rooms'):
            room_dict = sio.manager.rooms['/'].get(store_id, {})
            current_count = len(room_dict) if room_dict else 0
        
        # Enforce 2-user maximum limit
        if current_count >= 2:
            print(f"Client {sid} tried to join store {store_id} but it's full ({current_count}/2)")
            await sio.emit('store_full', {'storeId': store_id}, room=sid)
            return
        
        # Allow join
        await sio.enter_room(sid, store_id)
        print(f"Client {sid} joined store {store_id}")
        await sio.emit('user_joined', {'sid': sid}, room=store_id)
        
        # Count users in the room (after joining) and broadcast
        user_count = 0
        if hasattr(sio.manager, 'rooms'):
            room_dict = sio.manager.rooms['/'].get(store_id, {})
            user_count = len(room_dict) if room_dict else 0
        
        # Update database with new count
        await StoreService.update_active_users(store_id, user_count)
        # Broadcast updated count
        await sio.emit('active_user_count', {'count': user_count}, room=store_id)

@sio.event
async def leave_store(sid, data):
    store_id = data.get('storeId')
    if store_id:
        await sio.leave_room(sid, store_id)
        print(f"Client {sid} left store {store_id}")
        await sio.emit('user_left', {'sid': sid}, room=store_id)
        # Count users in the room and broadcast
        user_count = 0
        if hasattr(sio.manager, 'rooms'):
            room_dict = sio.manager.rooms['/'].get(store_id, {})
            user_count = len(room_dict) if room_dict else 0
        # Update database with new count
        await StoreService.update_active_users(store_id, user_count)
        # Broadcast updated count
        await sio.emit('active_user_count', {'count': user_count}, room=store_id)

@sio.event
async def model_moved(sid, data):
    store_id = data.get('storeId')
    if store_id:
        # Broadcast to others in the room
        await sio.emit('model_position_updated', data, room=store_id, skip_sid=sid)
